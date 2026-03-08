/**
 * Versioning Service - Week 8
 * Tracks evolution of corrected_text over time
 * This is AI gold for training models
 */
import SQLite from 'react-native-sqlite-storage';

let db: SQLite.SQLiteDatabase | null = null;

export interface TextVersion {
  id?: number;
  note_id: number;
  corrected_text: string;
  timestamp: number;
  change_stats?: {
    characters_changed: number;
    change_percentage: number;
  };
}

/**
 * Initialize versioning table
 */
export const initVersioning = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabase({
      name: 'SmartNotebook.db',
      location: 'default',
    });

    if (!db) {
      throw new Error('Database not available');
    }

    // Create text_versions table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS text_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        corrected_text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        change_stats TEXT,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );
    `);

    // Create index for faster queries
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_text_versions_note_id 
      ON text_versions(note_id);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_text_versions_timestamp 
      ON text_versions(timestamp DESC);
    `);

    console.log('✅ Versioning table initialized');
  } catch (error) {
    console.error('❌ Versioning initialization error:', error);
  }
};

/**
 * Save a new version of corrected_text
 */
export const saveVersion = async (
  noteId: number,
  correctedText: string,
  changeStats?: {
    characters_changed: number;
    change_percentage: number;
  },
): Promise<number> => {
  try {
    if (!db) {
      await initVersioning();
    }

    const timestamp = Date.now();
    const changeStatsJson = changeStats
      ? JSON.stringify(changeStats)
      : null;

    const [result] = await db!.executeSql(
      `INSERT INTO text_versions (note_id, corrected_text, timestamp, change_stats)
       VALUES (?, ?, ?, ?)`,
      [noteId, correctedText, timestamp, changeStatsJson],
    );

    const versionId = result.insertId;
    console.log(`✅ Saved version ${versionId} for note ${noteId}`);
    return versionId;
  } catch (error) {
    console.error('❌ Error saving version:', error);
    throw error;
  }
};

/**
 * Get all versions for a note (newest first)
 */
export const getVersions = async (noteId: number): Promise<TextVersion[]> => {
  try {
    if (!db) {
      await initVersioning();
    }

    const [results] = await db!.executeSql(
      `SELECT * FROM text_versions 
       WHERE note_id = ? 
       ORDER BY timestamp DESC`,
      [noteId],
    );

    const versions: TextVersion[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      versions.push({
        id: row.id,
        note_id: row.note_id,
        corrected_text: row.corrected_text,
        timestamp: row.timestamp,
        change_stats: row.change_stats
          ? JSON.parse(row.change_stats)
          : undefined,
      });
    }

    return versions;
  } catch (error) {
    console.error('❌ Error getting versions:', error);
    return [];
  }
};

/**
 * Get the latest version for a note
 */
export const getLatestVersion = async (
  noteId: number,
): Promise<TextVersion | null> => {
  try {
    const versions = await getVersions(noteId);
    return versions.length > 0 ? versions[0] : null;
  } catch (error) {
    console.error('❌ Error getting latest version:', error);
    return null;
  }
};

/**
 * Get version count for a note
 */
export const getVersionCount = async (noteId: number): Promise<number> => {
  try {
    if (!db) {
      await initVersioning();
    }

    const [results] = await db!.executeSql(
      `SELECT COUNT(*) as count FROM text_versions WHERE note_id = ?`,
      [noteId],
    );

    return results.rows.item(0).count;
  } catch (error) {
    console.error('❌ Error getting version count:', error);
    return 0;
  }
};

/**
 * Delete old versions (keep only last N versions per note)
 */
export const cleanupOldVersions = async (
  keepCount: number = 10,
): Promise<void> => {
  try {
    if (!db) {
      await initVersioning();
    }

    // Delete versions beyond keepCount for each note
    await db!.executeSql(`
      DELETE FROM text_versions
      WHERE id NOT IN (
        SELECT id FROM text_versions
        WHERE note_id = text_versions.note_id
        ORDER BY timestamp DESC
        LIMIT ?
      )
    `, [keepCount]);

    console.log(`✅ Cleaned up old versions (keeping ${keepCount} per note)`);
  } catch (error) {
    console.error('❌ Error cleaning up versions:', error);
  }
};

