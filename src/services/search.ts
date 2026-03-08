/**
 * Full-Text Search Service - Week 8
 * Implements SQLite FTS5 for local search
 * 
 * Docs: https://www.sqlite.org/fts5.html
 */
import {getAllNotes, type Note} from './database';
import SQLite from 'react-native-sqlite-storage';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize FTS5 virtual table for full-text search
 */
export const initFTS5 = async (): Promise<void> => {
  try {
    // Get database instance
    const {initDatabase} = await import('./database');
    await initDatabase();
    
    // Import db from database.ts (we'll need to export it)
    // For now, we'll create a separate connection
    db = await SQLite.openDatabase({
      name: 'SmartNotebook.db',
      location: 'default',
    });

    if (!db) {
      throw new Error('Database not available');
    }

    // Create FTS5 virtual table if it doesn't exist
    await db.executeSql(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        id UNINDEXED,
        title,
        corrected_text,
        original_ocr_text,
        content='notes',
        content_rowid='id'
      );
    `);

    // Create triggers to keep FTS5 in sync with notes table
    await db.executeSql(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, corrected_text, original_ocr_text)
        VALUES (new.id, new.title, new.corrected_text, new.original_ocr_text);
      END;
    `);

    await db.executeSql(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
        DELETE FROM notes_fts WHERE rowid = old.id;
      END;
    `);

    await db.executeSql(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
        DELETE FROM notes_fts WHERE rowid = old.id;
        INSERT INTO notes_fts(rowid, title, corrected_text, original_ocr_text)
        VALUES (new.id, new.title, new.corrected_text, new.original_ocr_text);
      END;
    `);

    // Populate FTS5 with existing notes
    const notes = await getAllNotes();
    for (const note of notes) {
      if (note.id) {
        await db.executeSql(
          `INSERT OR IGNORE INTO notes_fts(rowid, title, corrected_text, original_ocr_text)
           VALUES (?, ?, ?, ?)`,
          [
            note.id,
            note.title || '',
            note.corrected_text || '',
            note.original_ocr_text || '',
          ],
        );
      }
    }

    console.log('✅ FTS5 initialized and populated');
  } catch (error) {
    console.error('❌ FTS5 initialization error:', error);
    // FTS5 might not be available, that's OK - search will fall back to LIKE queries
  }
};

/**
 * Search notes using FTS5
 */
export const searchNotes = async (
  query: string,
  folderId?: number | null,
): Promise<Note[]> => {
  try {
    if (!db) {
      await initFTS5();
    }

    if (!query.trim()) {
      return [];
    }

    // Escape special FTS5 characters
    const escapedQuery = query
      .replace(/"/g, '""')
      .replace(/'/g, "''")
      .trim();

    // Build FTS5 query
    // FTS5 syntax: "column:term" or just "term" (searches all columns)
    const ftsQuery = `"${escapedQuery}"* OR ${escapedQuery}*`;

    let sql = `
      SELECT n.*
      FROM notes n
      JOIN notes_fts fts ON n.id = fts.rowid
      WHERE notes_fts MATCH ?
    `;

    const params: any[] = [ftsQuery];

    if (folderId !== undefined && folderId !== null) {
      sql += ' AND n.folder_id = ?';
      params.push(folderId);
    }

    sql += ' ORDER BY rank';

    const [results] = await db!.executeSql(sql, params);

    const notes: Note[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
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

    return notes;
  } catch (error) {
    console.error('❌ Search error:', error);
    // Fallback to simple LIKE search if FTS5 fails
    return fallbackSearch(query, folderId);
  }
};

/**
 * Fallback search using LIKE (if FTS5 is not available)
 */
const fallbackSearch = async (
  query: string,
  folderId?: number | null,
): Promise<Note[]> => {
  try {
    const allNotes = await getAllNotes();
    const queryLower = query.toLowerCase();

    return allNotes.filter(note => {
      // Filter by folder if specified
      if (folderId !== undefined && folderId !== null) {
        if (note.folder_id !== folderId) {
          return false;
        }
      }

      // Search in title, corrected_text, and original_ocr_text
      const titleMatch = note.title?.toLowerCase().includes(queryLower);
      const correctedMatch = note.corrected_text
        ?.toLowerCase()
        .includes(queryLower);
      const originalMatch = note.original_ocr_text
        ?.toLowerCase()
        .includes(queryLower);

      return titleMatch || correctedMatch || originalMatch;
    });
  } catch (error) {
    console.error('❌ Fallback search error:', error);
    return [];
  }
};

/**
 * Rebuild FTS5 index (useful after bulk imports)
 */
export const rebuildFTSIndex = async (): Promise<void> => {
  try {
    if (!db) {
      await initFTS5();
    }

    await db!.executeSql('INSERT INTO notes_fts(notes_fts) VALUES("rebuild")');
    console.log('✅ FTS5 index rebuilt');
  } catch (error) {
    console.error('❌ FTS5 rebuild error:', error);
  }
};

