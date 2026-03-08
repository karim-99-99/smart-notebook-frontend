import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Linking,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';
import Clipboard from '@react-native-clipboard/clipboard';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {saveNote, updateNote, getAllFolders, type Folder, getNoteById, updateNoteSyncStatus} from '../services/database';
import {exportToWord, exportToPDF} from '../services/api';
import {syncSingleNote} from '../services/supabaseSync';
import {isAuthenticated} from '../lib/supabase';
import {calculateEditDistance} from '../utils/editDistance';
import {ConfidenceHighlighter, type LineData} from '../components/ConfidenceHighlighter';
import {calculateChangeStats, getChangeSummary} from '../utils/changeTracker';
import {colors} from '../theme/colors';
import {borders} from '../theme/borders';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
type EditNoteRouteProp = RouteProp<RootStackParamList, 'EditNote'>;

export const EditNoteScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditNoteRouteProp>();
  const {photoPath, ocrResult, noteId, folderId: initialFolderId} = route.params;

  // State
  const [editedText, setEditedText] = useState(ocrResult.full_text || '');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    initialFolderId !== undefined ? initialFolderId : null,
  );
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Training data fields
  const [language, setLanguage] = useState<string>('en'); // 'ar' | 'en' | 'mixed'
  const [contentType, setContentType] = useState<string>('handwritten'); // 'handwritten' | 'printed'
  
  // Week 8: Change tracking
  const [changeStats, setChangeStats] = useState<ReturnType<typeof calculateChangeStats> | null>(null);
  
  // Parse lines from OCR result
  const parsedLines: LineData[] = React.useMemo(() => {
    if (ocrResult.lines && Array.isArray(ocrResult.lines)) {
      return ocrResult.lines;
    }
    return [];
  }, [ocrResult.lines]);

  // Load folders
  React.useEffect(() => {
    const loadFolders = async () => {
      try {
        const allFolders = await getAllFolders();
        setFolders(allFolders);
        // If no folder selected and uncategorized exists, use it
        if (selectedFolderId === null && allFolders.length > 0) {
          const uncategorized = allFolders.find(f => f.name === 'Uncategorized');
          if (uncategorized) {
            setSelectedFolderId(uncategorized.id!);
          }
        }
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);

  // Load existing note data when editing
  React.useEffect(() => {
    const loadExistingNote = async () => {
      if (noteId) {
        try {
          const existingNote = await getNoteById(noteId);
          if (existingNote) {
            setEditedText(existingNote.corrected_text || '');
            setTitle(existingNote.title || '');
            if (existingNote.folder_id) {
              setSelectedFolderId(existingNote.folder_id);
            }
            // Load training data fields
            if (existingNote.language) {
              setLanguage(existingNote.language);
            }
            if (existingNote.content_type) {
              setContentType(existingNote.content_type);
            }
          }
        } catch (error) {
          console.error('Error loading existing note:', error);
        }
      }
    };
    loadExistingNote();
  }, [noteId]);

  // Week 8: Track changes as user edits
  React.useEffect(() => {
    const originalText = ocrResult.full_text || '';
    const correctedText = editedText;
    
    if (originalText && correctedText) {
      const stats = calculateChangeStats(originalText, correctedText);
      setChangeStats(stats);
    }
  }, [editedText, ocrResult.full_text]);

  const generateAutoTitle = async (): Promise<string> => {
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    const folderName = selectedFolder?.name || 'Note';
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generate title: "Folder Name - Month Day, Year at Time"
    return `${folderName} - ${dateStr} at ${timeStr}`;
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Verify folder is selected
    if (selectedFolderId === null && !noteId) {
      Alert.alert('Select Folder', 'Please choose a folder to save this note', [
        {text: 'Choose Folder', onPress: () => setShowFolderPicker(true)},
      ]);
      return;
    }

    try {
      setIsSaving(true);

      // Generate auto-title if user didn't provide one
      const finalTitle = title.trim() || (await generateAutoTitle());

      if (noteId) {
        // Calculate edit distance for updated note
        const existingNote = await getNoteById(noteId);
        const rawText = existingNote?.original_ocr_text || '';
        const correctedText = editedText;
        const editDistance = calculateEditDistance(rawText, correctedText);
        
        // Update existing note (including folder if changed)
        await updateNote(noteId, editedText, finalTitle, selectedFolderId, language, contentType, editDistance);
        const selectedFolder = folders.find(f => f.id === selectedFolderId);
        Alert.alert(
          '✅ Updated',
          `Note updated in "${selectedFolder?.name || 'Uncategorized'}"`,
        );
      } else {
        // Calculate edit distance (measures OCR error)
        const rawText = ocrResult.full_text || '';
        const correctedText = editedText;
        const editDistance = calculateEditDistance(rawText, correctedText);
        
        // Save new note locally first (offline-first approach)
        const savedId = await saveNote({
          folder_id: selectedFolderId,
          image_path: photoPath,
          original_ocr_text: rawText, // Raw OCR
          corrected_text: correctedText, // User-edited version
          line_count: ocrResult.line_count || 0,
          average_confidence: ocrResult.average_confidence || 0,
          timestamp: Date.now(),
          lines: JSON.stringify(ocrResult.lines || []),
          title: finalTitle,
          synced: false, // Mark as not synced yet
          language: language, // Training data: language label
          content_type: contentType, // Training data: content type label
          edit_distance: editDistance, // Training data: OCR error measurement
        });
        console.log('💾 Note saved locally with ID:', savedId, 'Title:', finalTitle);
        
        // Get the saved note for syncing
        const savedNote = await getNoteById(savedId);
        
        // Try to sync to cloud in background (if authenticated)
        if (savedNote && (await isAuthenticated())) {
          console.log('🔄 Starting background sync...');
          syncSingleNote(savedNote)
            .then(result => {
              if (result.success) {
                console.log('✅ Note synced to cloud');
                // Update note with image URL and sync status
                if (result.imageUrl) {
                  updateNoteSyncStatus(savedId, true, result.imageUrl);
                }
              } else {
                console.log('⚠️ Sync failed (will retry later):', result.error);
                // Note remains unsynced, will retry on next sync
              }
            })
            .catch(error => {
              console.error('❌ Sync error:', error);
              // Note remains unsynced, will retry later
            });
        }
        
        const selectedFolder = folders.find(f => f.id === selectedFolderId);
        Alert.alert(
          '✅ Saved',
          `Note saved to "${selectedFolder?.name || 'Uncategorized'}"${(await isAuthenticated()) ? '\n🔄 Syncing to cloud...' : '\n💡 Sign in to enable cloud sync'}`,
          [
            {
              text: 'Stay Here',
              style: 'cancel',
            },
            {
              text: 'View Folder',
              onPress: () => {
                navigation.navigate('History', {folderId: selectedFolderId});
              },
            },
            {
              text: 'Scan More',
              onPress: () => {
                // Navigate to Scan screen (clear stack)
                navigation.reset({
                  index: 0,
                  routes: [{name: 'Scan'}],
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Error', 
        `Failed to save note: ${errorMessage}`,
        [{text: 'OK'}]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareText = async () => {
    try {
      setShowShareMenu(false);
      await Share.open({
        message: editedText,
        title: title || 'Smart Notebook Note',
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Share error:', error);
        Alert.alert('Error', 'Failed to share text');
      }
    }
  };

  const handleShareImage = async () => {
    try {
      setShowShareMenu(false);
      
      const shareOptions = {
        title: title || 'Smart Notebook Image',
        message: title || 'Smart Notebook Image',
        url: `file://${photoPath}`,
        type: 'image/jpeg',
      };
      
      await Share.open(shareOptions);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Share image error:', error);
        Alert.alert('Error', `Failed to share image: ${error}`);
      }
    }
  };

  const handleShareWord = async () => {
    try {
      setShowShareMenu(false);
      setIsExporting(true);
      
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const filename = `smart_notebook_${timestamp}.docx`;
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      const result = await exportToWord(editedText, title || 'Smart Notebook', filePath);
      
      if (result.success && result.filePath) {
        const shareOptions = {
          title: title || 'Smart Notebook Document',
          message: `${title || 'Smart Notebook Document'}`,
          url: `file://${result.filePath}`,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          filename: filename,
        };
        
        await Share.open(shareOptions);
      } else {
        Alert.alert('Error', result.error || 'Failed to export Word document');
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Share Word error:', error);
        Alert.alert('Error', `Failed to share Word: ${error}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePDF = async () => {
    try {
      setShowShareMenu(false);
      setIsExporting(true);
      
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const filename = `smart_notebook_${timestamp}.pdf`;
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      const result = await exportToPDF(editedText, title || 'Smart Notebook', filePath);
      
      if (result.success && result.filePath) {
        const shareOptions = {
          title: title || 'Smart Notebook Document',
          message: `${title || 'Smart Notebook Document'}`,
          url: `file://${result.filePath}`,
          type: 'application/pdf',
          filename: filename,
        };
        
        await Share.open(shareOptions);
      } else {
        Alert.alert('Error', result.error || 'Failed to export PDF document');
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Share PDF error:', error);
        Alert.alert('Error', `Failed to share PDF: ${error}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(editedText);
    Alert.alert('✅ Copied', 'Text copied to clipboard');
  };

  const handleExportToWord = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .substring(0, 19);
      const filename = `smart_notebook_${timestamp}.docx`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${filename}`;

      const result = await exportToWord(
        editedText,
        title || 'Smart Notebook Note',
        downloadPath,
      );

      if (result.success) {
        Alert.alert(
          '✅ Exported',
          `Word document saved to:\nDownloads/${filename}`,
        );
      } else {
        Alert.alert('❌ Export Failed', result.error || 'Could not export');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert('Error', 'Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard Changes?', 'Are you sure? This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{name: 'Scan'}],
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Scan')}>
            <Text style={styles.navIcon}>📷</Text>
            <Text style={styles.navLabel}>Scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Folders')}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navLabel}>Folders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.navIcon}>📝</Text>
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView}>
        {/* Image Preview - Tap to view full screen */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => setShowImageViewer(true)}
          activeOpacity={0.9}>
          <Image source={{uri: photoPath}} style={styles.image} resizeMode="contain" />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageHint}>👆 Tap to view full size</Text>
          </View>
        </TouchableOpacity>

        {/* Title Input */}
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Add a title (optional)"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Folder Selector */}
        <TouchableOpacity
          style={styles.folderSelector}
          onPress={() => setShowFolderPicker(true)}>
          <Text style={styles.folderLabel}>Save to:</Text>
          <View style={styles.folderSelected}>
            <Text style={styles.folderIcon}>
              {folders.find(f => f.id === selectedFolderId)?.icon || '📁'}
            </Text>
            <Text style={styles.folderName}>
              {folders.find(f => f.id === selectedFolderId)?.name ||
                'Select Folder'}
            </Text>
            <Text style={styles.folderArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* Training Data Labels */}
        <View style={styles.trainingDataContainer}>
          <Text style={styles.trainingDataLabel}>📊 Training Labels:</Text>
          
          {/* Language Selector */}
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Language:</Text>
            <View style={styles.labelButtons}>
              {['en', 'ar', 'mixed'].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.labelButton,
                    language === lang && styles.labelButtonActive,
                  ]}
                  onPress={() => setLanguage(lang)}>
                  <Text
                    style={[
                      styles.labelButtonText,
                      language === lang && styles.labelButtonTextActive,
                    ]}>
                    {lang === 'en' ? '🇬🇧 English' : lang === 'ar' ? '🇸🇦 Arabic' : '🌐 Mixed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Type Selector */}
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Type:</Text>
            <View style={styles.labelButtons}>
              {['handwritten', 'printed'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.labelButton,
                    contentType === type && styles.labelButtonActive,
                  ]}
                  onPress={() => setContentType(type)}>
                  <Text
                    style={[
                      styles.labelButtonText,
                      contentType === type && styles.labelButtonTextActive,
                    ]}>
                    {type === 'handwritten' ? '✍️ Handwritten' : '📄 Printed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* OCR Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {ocrResult.line_count} lines •{' '}
            {Math.round((ocrResult.average_confidence || 0) * 100)}% accuracy
          </Text>
          {changeStats && changeStats.changePercentage > 0 && (
            <Text style={styles.changeStatsText}>
              ✏️ {getChangeSummary(changeStats)}
            </Text>
          )}
          <Text style={styles.infoHint}>
            💡 Edit the text below to correct any mistakes
          </Text>
        </View>

        {/* Week 8: Confidence-based highlighting */}
        {parsedLines.length > 0 && (
          <ConfidenceHighlighter
            lines={parsedLines}
            threshold={0.85}
          />
        )}

        {/* Editable Text */}
        <View style={styles.textContainer}>
          <TextInput
            style={styles.textInput}
            value={editedText}
            onChangeText={setEditedText}
            multiline
            placeholder="Extracted text will appear here..."
            placeholderTextColor="#999"
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleDiscard}>
          <Text style={styles.buttonText}>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCopy}>
          <Text style={styles.buttonText}>📋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setShowShareMenu(true)}>
          <Text style={styles.buttonText}>📤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.exportButton,
            isExporting && styles.buttonDisabled,
          ]}
          onPress={handleExportToWord}
          disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>📄</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            isSaving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Viewer */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          <Image
            source={{uri: photoPath}}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Share Menu Modal */}
      <Modal
        visible={showShareMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareMenu(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Note</Text>
            <Text style={styles.modalSubtitle}>Choose how to share</Text>
            
            <ScrollView style={styles.shareOptionsScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareText}>
                <Text style={styles.shareOptionIcon}>📝</Text>
                <Text style={styles.shareOptionText}>Share as Text</Text>
                <Text style={styles.shareOptionDesc}>Copy-paste ready</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareImage}>
                <Text style={styles.shareOptionIcon}>📷</Text>
                <Text style={styles.shareOptionText}>Share Image</Text>
                <Text style={styles.shareOptionDesc}>Original photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareWord}
                disabled={isExporting}>
                <Text style={styles.shareOptionIcon}>📄</Text>
                <Text style={styles.shareOptionText}>Share as Word</Text>
                <Text style={styles.shareOptionDesc}>.docx format</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleSharePDF}
                disabled={isExporting}>
                <Text style={styles.shareOptionIcon}>📕</Text>
                <Text style={styles.shareOptionText}>Share as PDF</Text>
                <Text style={styles.shareOptionDesc}>.pdf format</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowShareMenu(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Folder Picker Modal */}
      <Modal
        visible={showFolderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Folder</Text>
            <ScrollView style={styles.folderList}>
              {folders.map(folder => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderItem,
                    selectedFolderId === folder.id &&
                      styles.folderItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedFolderId(folder.id!);
                    setShowFolderPicker(false);
                  }}>
                  <Text style={styles.folderItemIcon}>{folder.icon}</Text>
                  <Text style={styles.folderItemName}>{folder.name}</Text>
                  {selectedFolderId === folder.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowFolderPicker(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#000',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    alignItems: 'center',
  },
  imageHint: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 0,
  },
  infoContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoHint: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  changeStatsText: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    minHeight: 300,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    minHeight: 250,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  exportButton: {
    backgroundColor: colors.teal,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  folderSelector: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  folderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  folderSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderIcon: {
    fontSize: 20,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  folderArrow: {
    fontSize: 12,
    color: '#999',
  },
  trainingDataContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trainingDataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  labelRow: {
    marginBottom: 12,
  },
  labelText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  labelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  labelButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  labelButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  shareOptionsScroll: {
    maxHeight: 400,
    width: '100%',
  },
  shareOption: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  shareOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shareOptionDesc: {
    fontSize: 12,
    color: '#999',
  },
  modalCancelButton: {
    backgroundColor: '#6C757D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  folderList: {
    maxHeight: 300,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  folderItemSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  folderItemIcon: {
    fontSize: 24,
  },
  folderItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#6C757D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Navigation header styles – purple bar with teal border and shadow
  headerContainer: {
    backgroundColor: colors.primary,
    paddingBottom: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 16,
    ...borders.headerBar,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  navLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});

