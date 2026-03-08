import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';
import {getAllNotes, getNotesByFolder, getFolderById, deleteNote, type Note, type Folder} from '../services/database';
import {exportBulkNotes} from '../services/api';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {colors} from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;
type HistoryRouteProp = RouteProp<RootStackParamList, 'History'>;

export const HistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HistoryRouteProp>();
  const {folderId} = route.params || {};
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderName, setFolderName] = useState<string>('All Notes');
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load notes filtered by folder if folderId provided
      let allNotes: Note[];
      if (folderId !== undefined) {
        allNotes = await getNotesByFolder(folderId);
        
        // Get folder name for display
        if (folderId !== null) {
          const folder = await getFolderById(folderId);
          setFolderName(folder?.name || 'Unknown Folder');
        } else {
          setFolderName('Uncategorized');
        }
      } else {
        allNotes = await getAllNotes();
        setFolderName('All Notes');
      }
      
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  // Reload notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  const handleNotePress = (note: Note) => {
    // Parse lines from JSON string
    const lines = note.lines ? JSON.parse(note.lines) : [];
    
    console.log('📖 Opening note:', note.id);
    console.log('📷 Image path:', note.image_path);
    
    // Navigate to EditNote screen with note data
    navigation.navigate('EditNote', {
      photoPath: note.image_path,
      ocrResult: {
        text: note.original_ocr_text,
        full_text: note.corrected_text, // Show user's edited version
        line_count: note.line_count,
        average_confidence: note.average_confidence,
        lines: lines,
      },
      noteId: note.id, // Pass ID so we can update instead of create new
      folderId: note.folder_id, // Pass folder ID
    });
  };

  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              loadNotes(); // Reload list
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ],
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNotes(new Set());
  };

  const toggleNoteSelection = (noteId: number) => {
    const newSelection = new Set(selectedNotes);
    if (newSelection.has(noteId)) {
      newSelection.delete(noteId);
    } else {
      newSelection.add(noteId);
    }
    setSelectedNotes(newSelection);
  };

  const handleBulkShare = async (format: 'word' | 'pdf') => {
    if (selectedNotes.size === 0) {
      Alert.alert('No Selection', 'Please select at least one note to share');
      return;
    }

    try {
      const noteIds = Array.from(selectedNotes);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const extension = format === 'word' ? 'docx' : 'pdf';
      const filename = `smart_notebook_${noteIds.length}_notes_${timestamp}.${extension}`;
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      const title = `${folderName} - ${noteIds.length} Notes`;
      
      const result = await exportBulkNotes(noteIds, title, format, filePath);
      
      if (result.success && result.filePath) {
        const shareOptions = {
          title: title,
          message: `${noteIds.length} notes from ${folderName}`,
          url: `file://${result.filePath}`,
          type: format === 'word' 
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf',
          filename: filename,
        };
        
        await Share.open(shareOptions);
        
        // Exit selection mode after sharing
        setSelectionMode(false);
        setSelectedNotes(new Set());
      } else {
        Alert.alert('Error', result.error || 'Failed to export notes');
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Bulk share error:', error);
        Alert.alert('Error', `Failed to share notes: ${error}`);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderNoteItem = ({item}: {item: Note}) => {
    const displayTitle = item.title || 'Untitled Note';
    const preview = item.corrected_text.substring(0, 80);
    const truncatedPreview = preview.length < item.corrected_text.length 
      ? `${preview}...` 
      : preview;
    const isSelected = item.id ? selectedNotes.has(item.id) : false;

    return (
      <View style={[styles.noteCard, isSelected && styles.noteCardSelected]}>
        <View style={styles.noteContent}>
          {/* Checkbox in selection mode */}
          {selectionMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => item.id && toggleNoteSelection(item.id)}>
              <View style={[styles.checkboxBox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}
          
          {/* Image Thumbnail - Tap to view full size */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (selectionMode && item.id) {
                toggleNoteSelection(item.id);
              } else {
                setViewImageUri(item.image_path);
              }
            }}
            activeOpacity={0.8}>
            <Image
              source={{uri: item.image_path}}
              style={styles.noteThumbnail}
              resizeMode="cover"
            />
            {!selectionMode && (
              <View style={styles.thumbnailOverlay}>
                <Text style={styles.thumbnailHint}>🔍</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Note Details - Tap to edit or select */}
          <TouchableOpacity
            style={styles.noteDetails}
            onPress={() => selectionMode && item.id ? toggleNoteSelection(item.id) : handleNotePress(item)}
            onLongPress={() => !selectionMode && item.id && (setSelectionMode(true), toggleNoteSelection(item.id))}
            activeOpacity={0.7}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
              {!selectionMode && (
                <TouchableOpacity
                  onPress={() => handleDeleteNote(item.id!)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.noteDate}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.notePreview} numberOfLines={2}>
              {truncatedPreview}
            </Text>
            <Text style={styles.noteStats}>
              {item.line_count} lines • {Math.round(item.average_confidence * 100)}%
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Notes Yet</Text>
      <Text style={styles.emptyText}>
        Start scanning notebook pages to build your history
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}>
        <Text style={styles.scanButtonText}>📸 Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectionMode ? (
          // Selection Mode Header
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={toggleSelectionMode} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.selectionTitle}>
              {selectedNotes.size} selected
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                onPress={() => handleBulkShare('word')}
                style={styles.bulkActionButton}>
                <Text style={styles.bulkActionText}>📄</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBulkShare('pdf')}
                style={styles.bulkActionButton}>
                <Text style={styles.bulkActionText}>📕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Normal Header
          <View>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>📚 {folderName}</Text>
                <Text style={styles.subtitle}>
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </Text>
              </View>
              {notes.length > 0 && (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={toggleSelectionMode}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Notes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id!.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Full Screen Image Viewer */}
      <Modal
        visible={viewImageUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewImageUri(null)}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setViewImageUri(null)}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          {viewImageUri && (
            <Image
              source={{uri: viewImageUri}}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  noteContent: {
    flexDirection: 'row',
  },
  noteThumbnail: {
    width: 100,
    height: 120,
    backgroundColor: '#E0E0E0',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    alignItems: 'center',
  },
  thumbnailHint: {
    color: '#FFF',
    fontSize: 16,
  },
  noteDetails: {
    flex: 1,
    padding: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  deleteButton: {
    fontSize: 18,
  },
  notePreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  noteStats: {
    fontSize: 11,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkActionText: {
    fontSize: 20,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
});

