import SQLite from 'react-native-sqlite-storage';

// Don't enable promise API at module level - do it in initDatabase
// This prevents "getConstants of null" errors if native module isn't ready

// Database configuration
const DATABASE_NAME = 'SmartNotebook.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Smart Notebook Database';
const DATABASE_SIZE = 200000;

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Ensure database is initialized before any operation
 * This prevents race conditions and ensures native module is ready
 */
const ensureDatabase = async (): Promise<void> => {
  if (db) {
    return;
  }
  
  if (initPromise) {
    // If initialization is in progress, wait for it
    return initPromise;
  }
  
  // Start initialization
  initPromise = initDatabase();
  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
};

/**
 * Folder structure stored in database (Notebooks)
 */
export interface Folder {
  id?: number;
  name: string;
  color?: string; // For UI customization
  icon?: string; // Emoji or icon name
  created_at: number;
  updated_at: number;
  notes_count?: number; // Computed field
}

/**
 * Note structure stored in database (Pages in notebooks)
 */
export interface Note {
  id?: number;
  folder_id: number | null; // Foreign key to folders table
  image_path: string;
  original_ocr_text: string; // Raw OCR output (never modified)
  corrected_text: string; // User-edited version
  line_count: number;
  average_confidence: number;
  timestamp: number;
  lines?: string; // JSON string of lines array
  title?: string; // User can add title ("Page 1", "Lecture 2", etc.)
  
  // Sync fields (Week 7)
  image_url?: string; // Cloud storage URL
  synced: boolean; // Whether synced to cloud
  synced_at?: number; // Unix timestamp of last sync
  
  // Training data fields (Week 7+)
  language?: string; // 'ar' | 'en' | 'mixed' - Language of the text
  content_type?: string; // 'handwritten' | 'printed' | 'mixed' - Type of content
  edit_distance?: number; // Levenshtein distance between raw_text and corrected_text (measures OCR error)
}

/**
 * Initialize database and create tables if needed
 */
export const initDatabase = async (): Promise<void> => {
  try {
    if (db) {
      console.log('📦 Database already initialized');
      return;
    }

    console.log('📦 Initializing database...');
    
    // Check if SQLite module is available
    if (!SQLite) {
      const errorMsg = 'SQLite module not available. Make sure react-native-sqlite-storage is properly linked.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Enable promise API - do this here, not at module level
    try {
      SQLite.enablePromise(true);
    } catch (enableError) {
      console.warn('⚠️ enablePromise failed (may already be enabled):', enableError);
    }
    
    // Wait a bit to ensure native module is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if openDatabase function exists
    if (typeof SQLite.openDatabase !== 'function') {
      const errorMsg = 'SQLite.openDatabase is not a function. Native module may not be linked.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });
    } catch (openError: any) {
      console.error('❌ Failed to open database:', openError);
      const errorMessage = openError?.message || String(openError);
      if (errorMessage.includes('getConstants') || errorMessage.includes('null') || errorMessage.includes('undefined')) {
        throw new Error('SQLite native module not initialized. Please restart the app and ensure react-native-sqlite-storage is properly installed.');
      }
      throw new Error(`Database open failed: ${errorMessage}`);
    }

    console.log('📦 Database opened successfully');

    if (!db) {
      throw new Error('Database failed to open - db is null');
    }

    // Create folders table (notebooks)
    console.log('📦 Creating folders table...');
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    console.log('✅ Folders table created');

    // Create notes table (pages)
    console.log('📦 Creating notes table...');
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER,
        image_path TEXT,
        original_ocr_text TEXT NOT NULL,
        corrected_text TEXT NOT NULL,
        line_count INTEGER DEFAULT 0,
        average_confidence REAL DEFAULT 0.0,
        timestamp INTEGER NOT NULL,
        lines TEXT,
        title TEXT,
        image_url TEXT,
        synced INTEGER DEFAULT 0,
        synced_at INTEGER,
        language TEXT,
        content_type TEXT,
        edit_distance INTEGER,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ Notes table created');

    // Migrate existing tables to add new columns if they don't exist
    console.log('📦 Checking for schema migrations...');
    try {
      // Try to add new columns (will fail silently if they already exist)
      await db.executeSql('ALTER TABLE notes ADD COLUMN image_url TEXT');
      console.log('✅ Added image_url column');
    } catch (e) {
      // Column already exists, that's OK
      console.log('ℹ️ image_url column already exists');
    }
    
    try {
      await db.executeSql('ALTER TABLE notes ADD COLUMN synced INTEGER DEFAULT 0');
      console.log('✅ Added synced column');
    } catch (e) {
      console.log('ℹ️ synced column already exists');
    }
    
    try {
      await db.executeSql('ALTER TABLE notes ADD COLUMN synced_at INTEGER');
      console.log('✅ Added synced_at column');
    } catch (e) {
      console.log('ℹ️ synced_at column already exists');
    }
    
    try {
      await db.executeSql('ALTER TABLE notes ADD COLUMN language TEXT');
      console.log('✅ Added language column');
    } catch (e) {
      console.log('ℹ️ language column already exists');
    }
    
    try {
      await db.executeSql('ALTER TABLE notes ADD COLUMN content_type TEXT');
      console.log('✅ Added content_type column');
    } catch (e) {
      console.log('ℹ️ content_type column already exists');
    }
    
    try {
      await db.executeSql('ALTER TABLE notes ADD COLUMN edit_distance INTEGER');
      console.log('✅ Added edit_distance column');
    } catch (e) {
      console.log('ℹ️ edit_distance column already exists');
    }

    // Create default "Uncategorized" folder if it doesn't exist
    console.log('📦 Checking for default folder...');
    const result = await db.executeSql('SELECT COUNT(*) as count FROM folders');
    if (result[0].rows.item(0).count === 0) {
      const now = Date.now();
      await db.executeSql(
        'INSERT INTO folders (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['Uncategorized', '#6C757D', '📝', now, now],
      );
      console.log('📁 Created default "Uncategorized" folder');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
    console.log('📦 Database closed');
  }
};

/**
 * Save a new note to database
 */
export const saveNote = async (note: Omit<Note, 'id'>): Promise<number> => {
  try {
    await ensureDatabase();

    // Validate required fields
    if (!note.original_ocr_text && !note.corrected_text) {
      throw new Error('Note must have either original_ocr_text or corrected_text');
    }

    const linesJson = note.lines ? note.lines : '[]';

    const result = await db!.executeSql(
      `INSERT INTO notes (folder_id, image_path, original_ocr_text, corrected_text, line_count, average_confidence, timestamp, lines, title, image_url, synced, synced_at, language, content_type, edit_distance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        note.folder_id !== undefined ? note.folder_id : null,
        note.image_path || null, // Allow null for image_path
        note.original_ocr_text || '',
        note.corrected_text || '',
        note.line_count || 0,
        note.average_confidence || 0,
        note.timestamp || Date.now(),
        linesJson,
        note.title || null,
        note.image_url || null,
        note.synced !== undefined ? (note.synced ? 1 : 0) : 0,
        note.synced_at || null,
        note.language || null,
        note.content_type || null,
        note.edit_distance !== undefined ? note.edit_distance : null,
      ],
    );

    const noteId = result[0].insertId;
    console.log('✅ Note saved with ID:', noteId);
    return noteId;
  } catch (error) {
    console.error('❌ Error saving note:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error details:', errorMessage);
    throw new Error(`Failed to save note: ${errorMessage}`);
  }
};

/**
 * Get all notes ordered by timestamp (newest first)
 */
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(
      'SELECT * FROM notes ORDER BY timestamp DESC',
    );

    const notes: Note[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      notes.push({
        id: row.id,
        image_path: row.image_path,
        original_ocr_text: row.original_ocr_text,
        corrected_text: row.corrected_text,
        line_count: row.line_count,
        average_confidence: row.average_confidence,
        timestamp: row.timestamp,
        lines: row.lines,
        folder_id: row.folder_id,
        title: row.title,
        image_url: row.image_url,
        synced: row.synced === 1,
        synced_at: row.synced_at,
        language: row.language,
        content_type: row.content_type,
        edit_distance: row.edit_distance,
      });
    }

    console.log(`📖 Retrieved ${notes.length} notes from database`);
    return notes;
  } catch (error) {
    console.error('❌ Error getting notes:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 */
export const getNoteById = async (id: number): Promise<Note | null> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(
      'SELECT * FROM notes WHERE id = ?',
      [id],
    );

    if (results[0].rows.length === 0) {
      return null;
    }

    const row = results[0].rows.item(0);
    return {
      id: row.id,
      image_path: row.image_path,
      original_ocr_text: row.original_ocr_text,
      corrected_text: row.corrected_text,
      line_count: row.line_count,
      average_confidence: row.average_confidence,
      timestamp: row.timestamp,
      lines: row.lines,
      folder_id: row.folder_id,
      title: row.title,
      image_url: row.image_url,
      synced: row.synced === 1,
      synced_at: row.synced_at,
      language: row.language,
      content_type: row.content_type,
      edit_distance: row.edit_distance,
    };
  } catch (error) {
    console.error('❌ Error getting note by ID:', error);
    throw error;
  }
};

/**
 * Update a note's corrected text, title, and folder
 */
export const updateNote = async (
  id: number,
  correctedText: string,
  title?: string,
  folderId?: number | null,
  language?: string,
  contentType?: string,
  editDistance?: number,
): Promise<void> => {
  try {
    await ensureDatabase();

    if (folderId !== undefined) {
      await db!.executeSql(
        'UPDATE notes SET corrected_text = ?, title = ?, folder_id = ?, synced = 0, language = ?, content_type = ?, edit_distance = ? WHERE id = ?',
        [correctedText, title || null, folderId, language || null, contentType || null, editDistance !== undefined ? editDistance : null, id],
      );
    } else {
      await db!.executeSql(
        'UPDATE notes SET corrected_text = ?, title = ?, synced = 0, language = ?, content_type = ?, edit_distance = ? WHERE id = ?',
        [correctedText, title || null, language || null, contentType || null, editDistance !== undefined ? editDistance : null, id],
      );
    }
    console.log('✏️ Note updated:', id);
  } catch (error) {
    console.error('❌ Error updating note:', error);
    throw error;
  }
};

/**
 * Update note sync status after successful cloud sync
 */
export const updateNoteSyncStatus = async (
  id: number,
  synced: boolean,
  imageUrl?: string,
): Promise<void> => {
  try {
    await ensureDatabase();

    if (imageUrl) {
      await db!.executeSql(
        'UPDATE notes SET synced = ?, synced_at = ?, image_url = ? WHERE id = ?',
        [synced ? 1 : 0, Date.now(), imageUrl, id],
      );
    } else {
      await db!.executeSql(
        'UPDATE notes SET synced = ?, synced_at = ? WHERE id = ?',
        [synced ? 1 : 0, Date.now(), id],
      );
    }

    console.log('✅ Note sync status updated');
  } catch (error) {
    console.error('❌ Error updating sync status:', error);
    throw error;
  }
};

/**
 * Get all unsynced notes (for sync operation)
 */
export const getUnsyncedNotes = async (): Promise<Note[]> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(
      'SELECT * FROM notes WHERE synced = 0 OR synced IS NULL ORDER BY timestamp DESC',
    );

    const notes: Note[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      notes.push({
        id: row.id,
        folder_id: row.folder_id,
        image_path: row.image_path,
        original_ocr_text: row.original_ocr_text,
        corrected_text: row.corrected_text,
        line_count: row.line_count,
        average_confidence: row.average_confidence,
        timestamp: row.timestamp,
        lines: row.lines,
        title: row.title,
        image_url: row.image_url,
        synced: row.synced === 1,
        synced_at: row.synced_at,
        language: row.language,
        content_type: row.content_type,
        edit_distance: row.edit_distance,
      });
    }

    console.log(`📤 Found ${notes.length} unsynced notes`);
    return notes;
  } catch (error) {
    console.error('❌ Error getting unsynced notes:', error);
    throw error;
  }
};

/**
 * Get all unsynced folders (for sync operation)
 */
export const getUnsyncedFolders = async (): Promise<Folder[]> => {
  try {
    await ensureDatabase();

    // For now, return all folders (we can add synced flag later)
    return await getAllFolders();
  } catch (error) {
    console.error('❌ Error getting unsynced folders:', error);
    throw error;
  }
};

/**
 * Delete a note by ID
 */
export const deleteNote = async (id: number): Promise<void> => {
  try {
    await ensureDatabase();

    await db!.executeSql('DELETE FROM notes WHERE id = ?', [id]);
    console.log('🗑️ Note deleted:', id);
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    throw error;
  }
};

/**
 * Search notes by text content
 */
export const searchNotes = async (searchTerm: string): Promise<Note[]> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(
      `SELECT * FROM notes 
       WHERE corrected_text LIKE ? OR original_ocr_text LIKE ? OR title LIKE ?
       ORDER BY timestamp DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
    );

    const notes: Note[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      notes.push({
        id: row.id,
        image_path: row.image_path,
        original_ocr_text: row.original_ocr_text,
        corrected_text: row.corrected_text,
        line_count: row.line_count,
        average_confidence: row.average_confidence,
        timestamp: row.timestamp,
        lines: row.lines,
        folder_id: row.folder_id,
        title: row.title,
        image_url: row.image_url,
        synced: row.synced === 1,
        synced_at: row.synced_at,
        language: row.language,
        content_type: row.content_type,
        edit_distance: row.edit_distance,
      });
    }

    console.log(`🔍 Found ${notes.length} notes matching "${searchTerm}"`);
    return notes;
  } catch (error) {
    console.error('❌ Error searching notes:', error);
    throw error;
  }
};

/**
 * Get total number of notes
 */
export const getNotesCount = async (): Promise<number> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql('SELECT COUNT(*) as count FROM notes');
    return results[0].rows.item(0).count;
  } catch (error) {
    console.error('❌ Error getting notes count:', error);
    return 0;
  }
};

// ==================== FOLDER MANAGEMENT ====================

/**
 * Create a new folder
 */
export const createFolder = async (
  name: string,
  color?: string,
  icon?: string,
): Promise<number> => {
  try {
    await ensureDatabase();

    const now = Date.now();
    const result = await db!.executeSql(
      'INSERT INTO folders (name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [name, color || '#007AFF', icon || '📁', now, now],
    );

    const folderId = result[0].insertId;
    console.log('📁 Folder created with ID:', folderId);
    return folderId;
  } catch (error) {
    console.error('❌ Error creating folder:', error);
    throw error;
  }
};

/**
 * Get all folders with note counts
 */
export const getAllFolders = async (): Promise<Folder[]> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(`
      SELECT 
        f.id,
        f.name,
        f.color,
        f.icon,
        f.created_at,
        f.updated_at,
        COUNT(n.id) as notes_count
      FROM folders f
      LEFT JOIN notes n ON f.id = n.folder_id
      GROUP BY f.id
      ORDER BY f.created_at ASC
    `);

    const folders: Folder[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      folders.push({
        id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon,
        created_at: row.created_at,
        updated_at: row.updated_at,
        notes_count: row.notes_count,
      });
    }

    console.log(`📁 Retrieved ${folders.length} folders`);
    return folders;
  } catch (error) {
    console.error('❌ Error getting folders:', error);
    throw error;
  }
};

/**
 * Get a folder by ID
 */
export const getFolderById = async (id: number): Promise<Folder | null> => {
  try {
    await ensureDatabase();

    const results = await db!.executeSql(
      `SELECT 
        f.id,
        f.name,
        f.color,
        f.icon,
        f.created_at,
        f.updated_at,
        COUNT(n.id) as notes_count
      FROM folders f
      LEFT JOIN notes n ON f.id = n.folder_id
      WHERE f.id = ?
      GROUP BY f.id`,
      [id],
    );

    if (results[0].rows.length === 0) {
      return null;
    }

    const row = results[0].rows.item(0);
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      created_at: row.created_at,
      updated_at: row.updated_at,
      notes_count: row.notes_count,
    };
  } catch (error) {
    console.error('❌ Error getting folder by ID:', error);
    throw error;
  }
};

/**
 * Get notes in a specific folder
 */
export const getNotesByFolder = async (folderId: number | null): Promise<Note[]> => {
  try {
    await ensureDatabase();

    let query: string;
    let params: any[];

    if (folderId === null) {
      // Get uncategorized notes
      query = 'SELECT * FROM notes WHERE folder_id IS NULL ORDER BY timestamp DESC';
      params = [];
    } else {
      query = 'SELECT * FROM notes WHERE folder_id = ? ORDER BY timestamp DESC';
      params = [folderId];
    }

    const results = await db!.executeSql(query, params);

    const notes: Note[] = [];
    const rows = results[0].rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      notes.push({
        id: row.id,
        folder_id: row.folder_id,
        image_path: row.image_path,
        original_ocr_text: row.original_ocr_text,
        corrected_text: row.corrected_text,
        line_count: row.line_count,
        average_confidence: row.average_confidence,
        timestamp: row.timestamp,
        lines: row.lines,
        title: row.title,
        image_url: row.image_url,
        synced: row.synced === 1,
        synced_at: row.synced_at,
        language: row.language,
        content_type: row.content_type,
        edit_distance: row.edit_distance,
      });
    }

    console.log(`📖 Retrieved ${notes.length} notes for folder ${folderId}`);
    return notes;
  } catch (error) {
    console.error('❌ Error getting notes by folder:', error);
    throw error;
  }
};

/**
 * Update folder name and properties
 */
export const updateFolder = async (
  id: number,
  name: string,
  color?: string,
  icon?: string,
): Promise<void> => {
  try {
    await ensureDatabase();

    const now = Date.now();
    await db!.executeSql(
      'UPDATE folders SET name = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?',
      [name, color || '#007AFF', icon || '📁', now, id],
    );
    console.log('✏️ Folder updated:', id);
  } catch (error) {
    console.error('❌ Error updating folder:', error);
    throw error;
  }
};

/**
 * Delete a folder and its notes
 */
export const deleteFolder = async (id: number): Promise<void> => {
  try {
    await ensureDatabase();

    // Delete all notes in the folder
    await db!.executeSql('DELETE FROM notes WHERE folder_id = ?', [id]);
    
    // Delete the folder
    await db!.executeSql('DELETE FROM folders WHERE id = ?', [id]);
    console.log('🗑️ Folder and its notes deleted:', id);
  } catch (error) {
    console.error('❌ Error deleting folder:', error);
    throw error;
  }
};

/**
 * Move a note to a different folder
 */
export const moveNoteToFolder = async (
  noteId: number,
  folderId: number | null,
): Promise<void> => {
  try {
    await ensureDatabase();

    await db!.executeSql('UPDATE notes SET folder_id = ? WHERE id = ?', [
      folderId,
      noteId,
    ]);
    console.log(`📦 Note ${noteId} moved to folder ${folderId}`);
  } catch (error) {
    console.error('❌ Error moving note:', error);
    throw error;
  }
};

// ==================== CLOUD SYNC PREPARATION ====================

/**
 * Export all notes as JSON for cloud sync
 * This prepares data in a format ready for cloud upload
 */
export const exportNotesAsJSON = async (): Promise<string> => {
  try {
    await ensureDatabase();

    const notes = await getAllNotes();
    
    const exportData = notes.map(note => ({
      id: note.id,
      folder_id: note.folder_id,
      title: note.title,
      image_path: note.image_path,
      original_ocr_text: note.original_ocr_text,
      corrected_text: note.corrected_text,
      line_count: note.line_count,
      average_confidence: note.average_confidence,
      timestamp: note.timestamp,
      lines: note.lines,
      created_at: new Date(note.timestamp).toISOString(),
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    console.log(`📤 Exported ${exportData.length} notes as JSON`);
    return jsonString;
  } catch (error) {
    console.error('❌ Error exporting notes as JSON:', error);
    throw error;
  }
};

/**
 * Export all folders as JSON for cloud sync
 * This prepares folder structure for cloud upload
 */
export const exportFoldersAsJSON = async (): Promise<string> => {
  try {
    await ensureDatabase();

    const folders = await getAllFolders();
    
    const exportData = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      icon: folder.icon,
      created_at: new Date(folder.created_at).toISOString(),
      updated_at: new Date(folder.updated_at).toISOString(),
      notes_count: folder.notes_count,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    console.log(`📤 Exported ${exportData.length} folders as JSON`);
    return jsonString;
  } catch (error) {
    console.error('❌ Error exporting folders as JSON:', error);
    throw error;
  }
};

/**
 * Export complete database snapshot for cloud sync
 * Returns an object with both folders and notes
 */
export const exportDatabaseSnapshot = async (): Promise<{
  folders: any[];
  notes: any[];
  exported_at: string;
}> => {
  try {
    await ensureDatabase();

    const [folders, notes] = await Promise.all([
      getAllFolders(),
      getAllNotes(),
    ]);

    const snapshot = {
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        created_at: new Date(folder.created_at).toISOString(),
        updated_at: new Date(folder.updated_at).toISOString(),
        notes_count: folder.notes_count,
      })),
      notes: notes.map(note => ({
        id: note.id,
        folder_id: note.folder_id,
        title: note.title,
        image_path: note.image_path,
        original_ocr_text: note.original_ocr_text,
        corrected_text: note.corrected_text,
        line_count: note.line_count,
        average_confidence: note.average_confidence,
        timestamp: note.timestamp,
        lines: note.lines,
        created_at: new Date(note.timestamp).toISOString(),
      })),
      exported_at: new Date().toISOString(),
    };

    console.log(`📦 Database snapshot: ${snapshot.folders.length} folders, ${snapshot.notes.length} notes`);
    return snapshot;
  } catch (error) {
    console.error('❌ Error creating database snapshot:', error);
    throw error;
  }
};

/**
 * Get sync-ready data for a specific folder (including all its notes)
 * Useful for selective sync
 */
export const exportFolderWithNotes = async (folderId: number): Promise<{
  folder: any;
  notes: any[];
}> => {
  try {
    await ensureDatabase();

    const [folder, notes] = await Promise.all([
      getFolderById(folderId),
      getNotesByFolder(folderId),
    ]);

    if (!folder) {
      throw new Error(`Folder with ID ${folderId} not found`);
    }

    const exportData = {
      folder: {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        created_at: new Date(folder.created_at).toISOString(),
        updated_at: new Date(folder.updated_at).toISOString(),
        notes_count: folder.notes_count,
      },
      notes: notes.map(note => ({
        id: note.id,
        folder_id: note.folder_id,
        title: note.title,
        image_path: note.image_path,
        original_ocr_text: note.original_ocr_text,
        corrected_text: note.corrected_text,
        line_count: note.line_count,
        average_confidence: note.average_confidence,
        timestamp: note.timestamp,
        lines: note.lines,
        created_at: new Date(note.timestamp).toISOString(),
      })),
    };

    console.log(`📁 Exported folder "${folder.name}" with ${notes.length} notes`);
    return exportData;
  } catch (error) {
    console.error('❌ Error exporting folder with notes:', error);
    throw error;
  }
};

