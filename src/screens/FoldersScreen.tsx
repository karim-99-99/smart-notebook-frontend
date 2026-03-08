import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {
  getAllFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  exportDatabaseSnapshot,
  getNotesByFolder,
  type Folder,
} from '../services/database';
import {exportBulkNotes} from '../services/api';
import {manualSyncAll} from '../services/supabaseSync';
import {isAuthenticated} from '../lib/supabase';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {colors} from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Folders'>;

const FOLDER_ICONS = ['📁', '📚', '📖', '📓', '📕', '📗', '📘', '📙', '🗂️', '📋'];
const FOLDER_COLORS = [
  colors.primary,
  colors.teal,
  '#FF9500', // Orange
  '#FF3B30', // Red
  colors.primaryLight,
  '#5AC8FA', // Cyan
  colors.accent,
  '#FF2D55', // Pink
];

export const FoldersScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(FOLDER_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editIcon, setEditIcon] = useState(FOLDER_ICONS[0]);
  const [editColor, setEditColor] = useState(FOLDER_COLORS[0]);
  const [updating, setUpdating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const allFolders = await getAllFolders();
      setFolders(allFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, [loadFolders]),
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      setCreating(true);
      await createFolder(newFolderName.trim(), selectedColor, selectedIcon);
      setNewFolderName('');
      setShowCreateModal(false);
      loadFolders();
      Alert.alert('✅ Success', 'Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const handleFolderPress = (folder: Folder) => {
    // Navigate to notes list filtered by this folder
    navigation.navigate('History', {folderId: folder.id});
  };

  const handleRenameFolder = (folder: Folder) => {
    setFolderToEdit(folder);
    setEditFolderName(folder.name);
    setEditIcon(folder.icon || '📁');
    setEditColor(folder.color || colors.primary);
    setShowRenameModal(true);
  };

  const handleUpdateFolder = async () => {
    if (!editFolderName.trim() || !folderToEdit) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      setUpdating(true);
      await updateFolder(folderToEdit.id!, editFolderName.trim(), editColor, editIcon);
      setShowRenameModal(false);
      setFolderToEdit(null);
      loadFolders();
      Alert.alert('✅ Success', 'Folder updated successfully');
    } catch (error) {
      console.error('Error updating folder:', error);
      Alert.alert('Error', 'Failed to update folder');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? All notes inside will be deleted too.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolder(folder.id!);
              loadFolders();
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder');
            }
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    try {
      // Check if user is authenticated
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        Alert.alert(
          'Not Signed In',
          'Please sign in to sync your data to the cloud.\n\nGo to Login screen to sign in.',
          [{text: 'OK'}],
        );
        return;
      }

      setSyncing(true);
      console.log('🔄 Starting manual sync...');

      const result = await manualSyncAll();

      if (result.success) {
        Alert.alert(
          '✅ Sync Complete',
          `Successfully synced:\n• ${result.syncedNotes} notes\n• ${result.syncedFolders} folders`,
          [{text: 'OK'}],
        );
        console.log('✅ Sync successful:', result);
      } else {
        const errorMsg = result.errors.length > 0 
          ? result.errors.join('\n')
          : 'Unknown error';
        
        Alert.alert(
          '⚠️ Sync Failed',
          `Some items failed to sync:\n\n${errorMsg}\n\nCheck console for details.`,
          [{text: 'OK'}],
        );
        console.error('❌ Sync failed:', result.errors);
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      Alert.alert(
        'Error',
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{text: 'OK'}],
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleTestExport = async () => {
    try {
      console.log('🧪 Testing JSON export...');
      const snapshot = await exportDatabaseSnapshot();
      console.log('📦 Export successful:', JSON.stringify(snapshot, null, 2));
      Alert.alert(
        '✅ Export Test Success',
        `Database snapshot created:\n\n${snapshot.folders.length} folders\n${snapshot.notes.length} notes\n\nCheck console for full JSON output.`,
      );
    } catch (error) {
      console.error('❌ Export test failed:', error);
      Alert.alert('❌ Export Test Failed', String(error));
    }
  };

  const handleShareFolder = (folder: Folder) => {
    Alert.alert(
      'Share Folder',
      `Share all notes from "${folder.name}" as a single document?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Word Document',
          onPress: () => shareFolder(folder, 'word'),
        },
        {
          text: 'PDF Document',
          onPress: () => shareFolder(folder, 'pdf'),
        },
      ],
    );
  };

  const shareFolder = async (folder: Folder, format: 'word' | 'pdf') => {
    try {
      if (!folder.id || !folder.notes_count) {
        Alert.alert('Error', 'This folder has no notes to share');
        return;
      }

      // Get all notes from this folder
      const folderNotes = await getNotesByFolder(folder.id);
      
      if (folderNotes.length === 0) {
        Alert.alert('Error', 'This folder has no notes to share');
        return;
      }

      const noteIds = folderNotes.map(n => n.id!).filter(id => id !== undefined);
      
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const extension = format === 'word' ? 'docx' : 'pdf';
      const filename = `${folder.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.${extension}`;
      const filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      const title = `${folder.name} - ${noteIds.length} Notes`;
      
      const result = await exportBulkNotes(noteIds, title, format, filePath);
      
      if (result.success && result.filePath) {
        const shareOptions = {
          title: title,
          message: `All notes from "${folder.name}"`,
          url: `file://${result.filePath}`,
          type: format === 'word' 
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf',
          filename: filename,
        };
        
        await Share.open(shareOptions);
      } else {
        Alert.alert('Error', result.error || 'Failed to export folder');
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('❌ Folder share error:', error);
        Alert.alert('Error', `Failed to share folder: ${error}`);
      }
    }
  };

  const renderFolderItem = ({item}: {item: Folder}) => (
    <View style={[styles.folderCard, {borderLeftColor: item.color || colors.primary}]}>
      <TouchableOpacity onPress={() => handleFolderPress(item)}>
        <View style={styles.folderHeader}>
          <View style={styles.folderInfo}>
            <Text style={styles.folderIcon}>{item.icon || '📁'}</Text>
            <View style={styles.folderTextContainer}>
              <Text style={styles.folderName}>{item.name}</Text>
              <Text style={styles.folderCount}>
                {item.notes_count || 0} {(item.notes_count || 0) === 1 ? 'note' : 'notes'}
              </Text>
            </View>
          </View>
          <View style={styles.folderActions}>
            {(item.notes_count || 0) > 0 && (
              <TouchableOpacity
                onPress={() => handleShareFolder(item)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionButton}>
                <Text style={styles.shareButton}>📤</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleRenameFolder(item)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.actionButton}>
              <Text style={styles.editButton}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteFolder(item)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={styles.actionButton}>
              <Text style={styles.deleteButton}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>📁 Folders</Text>
            <Text style={styles.subtitle}>
              {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSync}
              disabled={syncing}>
              {syncing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.syncButtonText}>🔄 Sync</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestExport}>
              <Text style={styles.testButtonText}>🧪 Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Folders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading folders...</Text>
        </View>
      ) : (
        <>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              📚 Each folder = notebook. Save multiple pages inside!
            </Text>
          </View>
          
          <FlatList
            data={folders}
            renderItem={renderFolderItem}
            keyExtractor={item => item.id!.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyText}>No folders yet</Text>
                <Text style={styles.emptySubtext}>
                  Create folders to organize your scanned pages
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Create Folder Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}>
        <Text style={styles.createButtonText}>➕ Create Folder</Text>
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>

            {/* Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name (e.g., Math, Physics)"
              placeholderTextColor="#999"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />

            {/* Icon Selector */}
            <Text style={styles.selectorLabel}>Choose Icon:</Text>
            <View style={styles.iconSelector}>
              {FOLDER_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}>
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Selector */}
            <Text style={styles.selectorLabel}>Choose Color:</Text>
            <View style={styles.colorSelector}>
              {FOLDER_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateFolder}
                disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createModalButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename/Edit Folder Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Folder</Text>

            {/* Name Input */}
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor="#999"
              value={editFolderName}
              onChangeText={setEditFolderName}
              autoFocus
            />

            {/* Icon Selector */}
            <Text style={styles.selectorLabel}>Choose Icon:</Text>
            <View style={styles.iconSelector}>
              {FOLDER_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    editIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setEditIcon(icon)}>
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Selector */}
            <Text style={styles.selectorLabel}>Choose Color:</Text>
            <View style={styles.colorSelector}>
              {FOLDER_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    editColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setEditColor(color)}
                />
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleUpdateFolder}
                disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createModalButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  folderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  folderTextContainer: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 14,
    color: '#666',
  },
  folderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  shareButton: {
    fontSize: 20,
  },
  editButton: {
    fontSize: 20,
  },
  deleteButton: {
    fontSize: 20,
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
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: colors.teal + '25',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.teal + '60',
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
  },
  infoText: {
    fontSize: 14,
    color: colors.tealDark,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  iconText: {
    fontSize: 24,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  createModalButton: {
    backgroundColor: colors.primary,
  },
  createModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

