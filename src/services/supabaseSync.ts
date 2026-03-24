/**
 * Supabase Sync Service - Week 7
 * Handles syncing folders and notes to/from Supabase
 * 
 * Architecture:
 * - Local-first: Save to SQLite first
 * - Background sync: Upload to Supabase when online
 * - Download sync: Pull from Supabase on login/new device
 */
import {getSupabase, getCurrentUser} from '../lib/supabase';
import {Folder, Note} from './database';
import RNFS from 'react-native-fs';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  message?: string;
}

/**
 * Upload image to Supabase Storage
 * 
 * Docs: https://supabase.com/docs/guides/storage
 */
export const uploadImageToSupabase = async (
  imageUri: string,
): Promise<{success: boolean; imageUrl?: string; error?: string}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {success: false, error: 'User not authenticated'};
    }
    const supabase = getSupabase();
    if (!supabase) return {success: false, error: 'Supabase not initialized'};

    // Read image file as base64
    const imageData = await RNFS.readFile(imageUri, 'base64');
    
    // Generate unique file path: user_id/timestamp.jpg
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}.jpg`;

    // Convert base64 to ArrayBuffer for Supabase
    // Supabase Storage accepts ArrayBuffer, Blob, or File
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Upload to Supabase Storage bucket "user-notes"
    const {data, error} = await supabase.storage
      .from('user-notes')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return {success: false, error: error.message};
    }

    // Get public URL
    const {
      data: {publicUrl},
    } = supabase.storage.from('user-notes').getPublicUrl(filePath);

    return {success: true, imageUrl: publicUrl};
  } catch (error) {
    console.error('❌ Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Sync folders to Supabase
 */
export const syncFoldersToSupabase = async (
  folders: Folder[],
): Promise<SyncResult & {folderMapping?: Map<number, string>}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: folders.length,
        message: 'User not authenticated',
      };
    }
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: folders.length,
        message: 'Supabase not initialized',
      };
    }

    const foldersData = folders.map(folder => ({
      user_id: user.id,
      name: folder.name,
      color: folder.color || null,
      icon: folder.icon || null,
      created_at: folder.created_at
        ? new Date(folder.created_at).toISOString()
        : new Date().toISOString(),
    }));

    // Upsert folders (insert or update if exists)
    const {data, error} = await supabase
      .from('folders')
      .upsert(foldersData, {
        onConflict: 'user_id,name', // Update if same user + name exists
      })
      .select();

    if (error) {
      console.error('❌ Folder sync error:', error);
      return {
        success: false,
        syncedCount: 0,
        failedCount: folders.length,
        message: error.message,
      };
    }

    // Create mapping: local_folder_id -> supabase_uuid
    // Match by name since we upsert by user_id,name
    const folderMapping = new Map<number, string>();
    if (data) {
      for (const localFolder of folders) {
        if (localFolder.id) {
          // Find matching Supabase folder by name
          const supabaseFolder = data.find(
            sf => sf.name === localFolder.name && sf.user_id === user.id
          );
          if (supabaseFolder) {
            folderMapping.set(localFolder.id, supabaseFolder.id);
            console.log(`📌 Mapped folder: local_id=${localFolder.id} -> supabase_uuid=${supabaseFolder.id} (${localFolder.name})`);
          }
        }
      }
    }

    return {
      success: true,
      syncedCount: data?.length || 0,
      failedCount: folders.length - (data?.length || 0),
      message: `Synced ${data?.length || 0} folders`,
      folderMapping,
    };
  } catch (error) {
    console.error('❌ Folder sync error:', error);
    return {
      success: false,
      syncedCount: 0,
      failedCount: folders.length,
      message: error instanceof Error ? error.message : 'Sync failed',
    };
  }
};

/**
 * Sync notes to Supabase
 * This stores raw_text + corrected_text for training data!
 */
export const syncNotesToSupabase = async (
  notes: Note[],
  folderMapping?: Map<number, string>, // Mapping: local_folder_id -> supabase_uuid
): Promise<SyncResult> => {
  try {
    console.log(`🔄 Starting sync for ${notes.length} notes...`);
    
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ User not authenticated');
      return {
        success: false,
        syncedCount: 0,
        failedCount: notes.length,
        message: 'User not authenticated',
      };
    }
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: notes.length,
        message: 'Supabase not initialized',
      };
    }

    console.log(`✅ User authenticated: ${user.id}`);
    if (folderMapping) {
      console.log(`📌 Using folder mapping with ${folderMapping.size} entries`);
    }

    // Validate and prepare notes data
    const notesData = notes
      .filter(note => {
        // Filter out notes without required data
        if (!note.original_ocr_text && !note.corrected_text) {
          console.warn(`⚠️ Skipping note ${note.id}: missing text data`);
          return false;
        }
        return true;
      })
      .map(note => {
        // Handle folder_id: Map local integer ID to Supabase UUID
        let folderId: string | null = null;
        if (note.folder_id) {
          // Check if it's already a UUID (string with dashes)
          const folderIdStr = String(note.folder_id);
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folderIdStr);
          if (isUUID) {
            folderId = folderIdStr;
          } else if (folderMapping && typeof note.folder_id === 'number') {
            // It's a local integer ID - map it to Supabase UUID
            const supabaseUuid = folderMapping.get(note.folder_id);
            if (supabaseUuid) {
              folderId = supabaseUuid;
              console.log(`✅ Mapped folder_id: local ${note.folder_id} -> UUID ${supabaseUuid}`);
            } else {
              console.warn(`⚠️ Note ${note.id}: folder_id ${note.folder_id} not found in mapping, setting to null`);
              folderId = null;
            }
          } else {
            // No mapping available, set to null
            console.log(`⚠️ Note ${note.id}: folder_id ${note.folder_id} is local ID but no mapping available, setting to null`);
            folderId = null;
          }
        }

        // Parse lines from string to JSON if needed
        // CRITICAL: lines must be sent as actual JSON, not stringified JSON
        let linesJson: any = null;
        if (note.lines) {
          try {
            // If lines is already a string (JSON string), parse it
            if (typeof note.lines === 'string') {
              linesJson = JSON.parse(note.lines);
            } else {
              // If it's already an object/array, use it directly
              linesJson = note.lines;
            }
          } catch (e) {
            console.warn(`⚠️ Failed to parse lines for note ${note.id}:`, e);
            linesJson = null;
          }
        }

        const noteData: any = {
          user_id: user.id,
          folder_id: folderId,
          title: note.title || 'Untitled Note',
          image_url: note.image_url || null,
          raw_text: note.original_ocr_text || '', // Original OCR output
          corrected_text: note.corrected_text || '', // User-edited version
          line_count: note.line_count || 0,
          average_confidence: String(note.average_confidence || '0'),
          lines: linesJson, // Send as actual JSON, not stringified
          timestamp: note.timestamp || Date.now(),
          synced_at: new Date().toISOString(), // CRITICAL: Mark sync completion time
        };

        // Add training data fields only if they have values
        // (These columns may not exist in Supabase yet if migration hasn't been run)
        if (note.language) {
          noteData.language = note.language;
        }
        if (note.content_type) {
          noteData.content_type = note.content_type;
        }
        if (note.edit_distance !== undefined && note.edit_distance !== null) {
          noteData.edit_distance = note.edit_distance;
        }

        // Add created_at as ISO string
        if (note.timestamp) {
          noteData.created_at = new Date(note.timestamp).toISOString();
        } else {
          noteData.created_at = new Date().toISOString();
        }

        return noteData;
      });

    if (notesData.length === 0) {
      console.warn('⚠️ No valid notes to sync');
      return {
        success: false,
        syncedCount: 0,
        failedCount: notes.length,
        message: 'No valid notes to sync',
      };
    }

    console.log(`📤 Attempting to upsert ${notesData.length} notes...`);
    console.log('📝 Sample note data:', JSON.stringify(notesData[0], null, 2));

    // Upsert so re-syncing an edited note updates rather than duplicates it.
    // Requires a unique constraint on (user_id, timestamp) in Supabase:
    //   ALTER TABLE notes ADD CONSTRAINT notes_user_timestamp_unique UNIQUE (user_id, timestamp);
    const {data, error} = await supabase
      .from('notes')
      .upsert(notesData, {onConflict: 'user_id,timestamp', ignoreDuplicates: false})
      .select();

    if (error) {
      console.error('❌ Note sync error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error hint:', error.hint);
      
      return {
        success: false,
        syncedCount: 0,
        failedCount: notes.length,
        message: `Sync failed: ${error.message} (Code: ${error.code})`,
      };
    }

    const syncedCount = data?.length || 0;
    console.log(`✅ Successfully synced ${syncedCount} notes`);

    return {
      success: true,
      syncedCount: syncedCount,
      failedCount: notes.length - syncedCount,
      message: `Synced ${syncedCount} notes`,
    };
  } catch (error) {
    console.error('❌ Note sync exception:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Exception details:', errorMessage);
    
    return {
      success: false,
      syncedCount: 0,
      failedCount: notes.length,
      message: `Sync exception: ${errorMessage}`,
    };
  }
};

/**
 * Download all user data from Supabase
 * Used when logging in on new device or restoring data
 */
export const downloadSyncFromSupabase = async (): Promise<{
  success: boolean;
  folders?: Folder[];
  notes?: Note[];
  error?: string;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {success: false, error: 'User not authenticated'};
    }
    const supabase = getSupabase();
    if (!supabase) {
      return {success: false, error: 'Supabase not initialized'};
    }

    // Download folders
    const {data: foldersData, error: foldersError} = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {ascending: false});

    if (foldersError) {
      console.error('❌ Download folders error:', foldersError);
      return {success: false, error: foldersError.message};
    }

    // Download notes
    const {data: notesData, error: notesError} = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {ascending: false});

    if (notesError) {
      console.error('❌ Download notes error:', notesError);
      return {success: false, error: notesError.message};
    }

    // Convert to local format
    const folders: Folder[] = (foldersData || []).map((f: any) => ({
      id: f.id, // Will be stored as string UUID in SQLite
      name: f.name,
      color: f.color,
      icon: f.icon,
      created_at: f.created_at
        ? new Date(f.created_at).getTime()
        : Date.now(),
    }));

    const notes: Note[] = (notesData || []).map((n: any) => {
      // Handle lines: if it's JSONB from Supabase, stringify it for local storage
      // Local SQLite stores lines as JSON string
      let linesString: string | undefined = undefined;
      if (n.lines !== null && n.lines !== undefined) {
        try {
          // If it's already a string, use it
          if (typeof n.lines === 'string') {
            linesString = n.lines;
          } else {
            // If it's JSONB (object/array), stringify it for local storage
            linesString = JSON.stringify(n.lines);
          }
        } catch (e) {
          console.warn(`⚠️ Failed to process lines for note ${n.id}:`, e);
          linesString = undefined;
        }
      }

      return {
        id: n.id, // UUID string
        folder_id: n.folder_id,
        title: n.title,
        image_path: '', // Local path will be set when downloading image
        original_ocr_text: n.raw_text || '',
        corrected_text: n.corrected_text || '',
        line_count: n.line_count || 0,
        average_confidence: parseFloat(n.average_confidence || '0'),
        timestamp: n.timestamp || (n.created_at ? new Date(n.created_at).getTime() : Date.now()),
        lines: linesString,
        image_url: n.image_url,
        synced: true,
        synced_at: Date.now(),
      };
    });

    return {
      success: true,
      folders,
      notes,
    };
  } catch (error) {
    console.error('❌ Download sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
};

/**
 * Sync a single note (used after saving)
 * 1. Upload image if not already uploaded
 * 2. Get folder mapping if folder_id exists
 * 3. Sync note data with correct folder_id
 * 4. Mark as synced in local DB
 */
export const syncSingleNote = async (
  note: Note,
): Promise<{success: boolean; imageUrl?: string; error?: string}> => {
  try {
    // Step 1: Upload image if needed
    let imageUrl = note.image_url;
    if (!imageUrl && note.image_path) {
      const uploadResult = await uploadImageToSupabase(note.image_path);
      if (!uploadResult.success) {
        return {success: false, error: uploadResult.error};
      }
      imageUrl = uploadResult.imageUrl;
    }

    // Step 2: Get folder mapping if note has a folder_id
    let folderMapping: Map<number, string> | undefined = undefined;
    if (note.folder_id && typeof note.folder_id === 'number') {
      try {
        // Get all folders and sync them to get mapping
        const {getAllFolders} = await import('./database');
        const allFolders = await getAllFolders();
        const folderResult = await syncFoldersToSupabase(allFolders);
        folderMapping = folderResult.folderMapping;
      } catch (error) {
        console.warn('⚠️ Could not get folder mapping, note will sync without folder_id:', error);
      }
    }

    // Step 3: Sync note with image URL and folder mapping
    const noteWithUrl = {...note, image_url: imageUrl};
    const syncResult = await syncNotesToSupabase([noteWithUrl], folderMapping);

    if (!syncResult.success) {
      return {success: false, error: syncResult.message};
    }

    return {success: true, imageUrl};
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
};

/**
 * Manual sync: Sync all unsynced notes and folders
 * Call this from a sync button in the UI
 */
export const manualSyncAll = async (): Promise<{
  success: boolean;
  syncedNotes: number;
  syncedFolders: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let syncedNotes = 0;
  let syncedFolders = 0;

  try {
    console.log('🔄 Starting manual sync...');

    // Import here to avoid circular dependency
    const {getUnsyncedNotes, getUnsyncedFolders} = await import('./database');

    // Get unsynced data
    const unsyncedNotes = await getUnsyncedNotes();
    const unsyncedFolders = await getUnsyncedFolders();

    console.log(`📊 Found ${unsyncedNotes.length} unsynced notes, ${unsyncedFolders.length} folders`);

    // STEP 1: Sync folders FIRST (they need to exist before notes reference them)
    let folderMapping: Map<number, string> | undefined = undefined;
    if (unsyncedFolders.length > 0) {
      console.log(`📁 Syncing ${unsyncedFolders.length} folders first...`);
      const foldersResult = await syncFoldersToSupabase(unsyncedFolders);
      syncedFolders = foldersResult.syncedCount;
      folderMapping = foldersResult.folderMapping; // Get the mapping
      if (!foldersResult.success) {
        errors.push(`Folders: ${foldersResult.message}`);
        console.error('❌ Folder sync failed:', foldersResult.message);
      } else {
        console.log(`✅ Synced ${syncedFolders} folders`);
        if (folderMapping) {
          console.log(`📌 Created folder mapping with ${folderMapping.size} entries`);
        }
      }
    }

    // STEP 2: Sync notes (following correct sync flow with folder mapping)
    if (unsyncedNotes.length > 0) {
      console.log(`📝 Syncing ${unsyncedNotes.length} notes...`);
      
      // For each note, follow the correct sync flow:
      // 1. Upload image if not uploaded
      // 2. Sync note data with image_url and correct folder_id
      // 3. Update local note: synced = 1
      const notesToSync: Note[] = [];
      
      for (const note of unsyncedNotes) {
        try {
          // Step 1: Upload image if needed
          let imageUrl = note.image_url;
          if (!imageUrl && note.image_path) {
            console.log(`📤 Uploading image for note ${note.id}...`);
            const uploadResult = await uploadImageToSupabase(note.image_path);
            if (uploadResult.success && uploadResult.imageUrl) {
              imageUrl = uploadResult.imageUrl;
              console.log(`✅ Image uploaded: ${imageUrl}`);
            } else {
              console.warn(`⚠️ Image upload failed for note ${note.id}: ${uploadResult.error}`);
              // Continue without image - note will sync but without image_url
            }
          }
          
          // Step 2: Add note with image URL to sync batch
          notesToSync.push({
            ...note,
            image_url: imageUrl || undefined,
          });
        } catch (error) {
          console.error(`❌ Error preparing note ${note.id} for sync:`, error);
          // Continue with other notes
        }
      }
      
      // Step 3: Sync all notes at once (with folder mapping)
      if (notesToSync.length > 0) {
        const notesResult = await syncNotesToSupabase(notesToSync, folderMapping);
        syncedNotes = notesResult.syncedCount;
        
        if (!notesResult.success) {
          errors.push(`Notes: ${notesResult.message}`);
          console.error('❌ Note sync failed:', notesResult.message);
        } else {
          console.log(`✅ Synced ${syncedNotes} notes`);
          
          // Step 4: Update local notes: synced = 1, image_url = ...
          // Import here to avoid circular dependency
          const {updateNoteSyncStatus} = await import('./database');
          
          for (const note of notesToSync) {
            if (note.id) {
              try {
                await updateNoteSyncStatus(
                  note.id,
                  true, // synced = 1
                  note.image_url, // image_url
                );
                console.log(`✅ Updated sync status for note ${note.id}`);
              } catch (error) {
                console.error(`❌ Failed to update sync status for note ${note.id}:`, error);
              }
            }
          }
        }
      }
    }

    const success = errors.length === 0;
    console.log(`✅ Manual sync complete: ${syncedNotes} notes, ${syncedFolders} folders`);

    return {
      success,
      syncedNotes,
      syncedFolders,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('❌ Manual sync failed:', errorMessage);
    return {
      success: false,
      syncedNotes,
      syncedFolders,
      errors,
    };
  }
};

/**
 * Full sync: Upload unsynced, then download latest
 */
export const performFullSync = async (
  unsyncedFolders: Folder[],
  unsyncedNotes: Note[],
): Promise<{
  success: boolean;
  uploaded: {folders: number; notes: number};
  downloaded: {folders: number; notes: number};
  error?: string;
}> => {
  try {
    // Upload unsynced data
    const foldersResult = await syncFoldersToSupabase(unsyncedFolders);
    const notesResult = await syncNotesToSupabase(unsyncedNotes);

    // Download latest from cloud
    const downloadResult = await downloadSyncFromSupabase();

    if (!downloadResult.success) {
      return {
        success: false,
        uploaded: {
          folders: foldersResult.syncedCount,
          notes: notesResult.syncedCount,
        },
        downloaded: {folders: 0, notes: 0},
        error: downloadResult.error,
      };
    }

    return {
      success: true,
      uploaded: {
        folders: foldersResult.syncedCount,
        notes: notesResult.syncedCount,
      },
      downloaded: {
        folders: downloadResult.folders?.length || 0,
        notes: downloadResult.notes?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      uploaded: {folders: 0, notes: 0},
      downloaded: {folders: 0, notes: 0},
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
};
