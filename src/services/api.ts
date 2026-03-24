import {OCRResult, UploadResponse} from '../types';
import type {NotebookQRData} from '../utils/qrCodeParser';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {getNoteById} from './database';

// ngrok: start backend then run "ngrok http 8000" (or "ngrok http 8002" if backend uses 8002). Copy the https URL here.
// Or use local WiFi IP: http://YOUR_IP:8000 or http://YOUR_IP:8002
const API_BASE_URL = 'https://set-promise-expects-causing.trycloudflare.com';
const OCR_SERVICE_URL = 'https://set-promise-expects-causing.trycloudflare.com';

const BACKEND_AUTH_TOKEN_KEY = 'backend_auth_token';

/**
 * Returns a safe file path for exports. On iOS, DownloadDirectoryPath doesn't exist —
 * use DocumentDirectoryPath instead (visible in the Files app under "On My iPhone").
 */
export const getExportPath = (filename: string): string => {
  const dir =
    Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.DownloadDirectoryPath;
  return `${dir}/${filename}`;
};

/** Decode JWT payload without any extra library. Returns null if malformed. */
const parseJwtExpiry = (token: string): number | null => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      Array.from(atob(b64), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    const payload = JSON.parse(json);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

// #region agent log
const DEBUG_LOG_PATH = `${RNFS.DocumentDirectoryPath}/debug.log`;
console.log('🔍 Debug log path:', DEBUG_LOG_PATH);
const writeDebugLog = (logData: any) => {
  const logLine = JSON.stringify({...logData, timestamp: Date.now()}) + '\n';
  RNFS.appendFile(DEBUG_LOG_PATH, logLine, 'utf8').catch(() => {});
};
// #endregion

/** Get token for backend API. Returns null (and removes stored token) when expired. */
export const getBackendAuthToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(BACKEND_AUTH_TOKEN_KEY);
  if (!token) return null;
  const exp = parseJwtExpiry(token);
  if (exp !== null && exp * 1000 < Date.now() + 60_000) {
    await AsyncStorage.removeItem(BACKEND_AUTH_TOKEN_KEY);
    return null;
  }
  return token;
};

/** Store backend JWT after login. Pass null to clear. */
export const setBackendAuthToken = async (token: string | null): Promise<void> => {
  if (token == null) await AsyncStorage.removeItem(BACKEND_AUTH_TOKEN_KEY);
  else await AsyncStorage.setItem(BACKEND_AUTH_TOKEN_KEY, token);
};

/**
 * Log in to the backend with email/password. Stores the token so OCR and other API calls work.
 * Call this after Supabase login so "Send to OCR" uses the same user.
 */
// Ngrok free tier: send this so the tunnel forwards the request instead of showing interstitial
const NGROK_HEADERS: Record<string, string> = API_BASE_URL.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {};

export const loginBackend = async (email: string, password: string): Promise<{error?: string}> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text || 'Backend login failed' };
    }
    const json = await res.json();
    const token = json.access_token;
    if (token) await setBackendAuthToken(token);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Backend login failed' };
  }
};

/**
 * Register the same email/password in the backend so OCR and API work after signup.
 * Returns alreadyRegistered: true when user exists (so caller can sync password and retry login).
 */
export const registerBackend = async (
  email: string,
  password: string,
): Promise<{error?: string; alreadyRegistered?: boolean}> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return {};
    const text = await res.text();
    if (res.status === 400 && (text.includes('already registered') || text.includes('Email already'))) {
      return { alreadyRegistered: true };
    }
    return { error: text || 'Backend registration failed' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Backend registration failed' };
  }
};

/**
 * Sync backend password for an existing user (e.g. after Supabase password change).
 * Call when login fails with 401 and register returns "already registered".
 */
export const syncBackendPassword = async (email: string, password: string): Promise<{error?: string}> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sync-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return {};
    const text = await res.text();
    return { error: text || 'Sync password failed' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sync password failed' };
  }
};

/**
 * Upload an image to the backend for OCR processing (via /api/notes/ocr).
 * Uses the stored backend auth token from login so "Send to OCR" works when you're logged in.
 * @param imageUri - Local file URI of the captured image
 * @param qrData - Optional QR code data for auto-configuration
 * @returns OCR result with extracted text
 */
export const uploadImageForOCR = async (
  imageUri: string,
  qrData?: NotebookQRData,
): Promise<UploadResponse> => {
  const fetchUrl = `${API_BASE_URL}/api/notes/ocr`;
  const token = await getBackendAuthToken();
  // #region agent log
  writeDebugLog({location:'api.ts:uploadImageForOCR',message:'uploadImageForOCR entry',data:{imageUri,fetchUrl,hasToken:!!token},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  // #endregion

  if (!token) {
    return {
      success: false,
      error: 'Not logged in to backend. Go to Login, sign in (or log out and log in again), then try Send to OCR. Check that the app can reach the backend.',
    };
  }

  try {
    console.log('📤 Uploading image to backend OCR:', imageUri);

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'notebook.jpg',
    } as any);
    if (qrData) {
      formData.append('language_hint', qrData.language_hint);
      formData.append('layout', qrData.layout);
      formData.append('notebook_id', qrData.notebook_id);
      formData.append('page_number', String(qrData.page_number));
      console.log('📋 QR Data passed to OCR:', qrData);
    }
    // #region agent log
    writeDebugLog({location:'api.ts:FormData',message:'FormData created',data:{imageUri,hasFormData:!!formData},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
    // #endregion

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('🔗 Calling backend OCR at:', fetchUrl);
    const fetchOptions = {
      method: 'POST',
      headers,
      body: formData,
    };
    // #region agent log
    writeDebugLog({location:'api.ts:Before fetch',message:'Before fetch call',data:{url:fetchUrl,method:fetchOptions.method,hasBody:!!fetchOptions.body},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion

    const TIMEOUT_MS = 60000;
    const fetchStartTime = Date.now();
    let response: Response;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const fetchPromise = fetch(fetchUrl, fetchOptions);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
      });
      response = await Promise.race([fetchPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
    } catch (fetchError) {
      if (timeoutId) clearTimeout(timeoutId);
      const fetchDuration = Date.now() - fetchStartTime;
      console.error('❌ Fetch exception:', fetchError);
      writeDebugLog({location:'api.ts:Fetch exception',message:'Fetch exception caught',data:{errorType:fetchError?.constructor?.name,errorMessage:fetchError instanceof Error ? fetchError.message : String(fetchError),fetchDuration,url:fetchUrl},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new Error(`Check connection to backend or log in. ${msg}`);
    }
    const fetchDuration = Date.now() - fetchStartTime;
    writeDebugLog({location:'api.ts:After fetch',message:'After fetch call',data:{status:response.status,ok:response.ok,fetchDuration},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      writeDebugLog({location:'api.ts:HTTP error',message:'HTTP error response',data:{status:response.status,errorText},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      if (response.status === 401) {
        await setBackendAuthToken(null);
        throw new Error('Check connection to backend or log in. Session expired or not authenticated — log out and log in again to use OCR.');
      }
      throw new Error(errorText || `API Error: ${response.status}`);
    }

    const raw = await response.json();
    const lines = raw.lines ?? [];
    const data: OCRResult = {
      id: raw.id,
      text: raw.text ?? raw.full_text ?? '',
      lines: Array.isArray(lines) ? lines : [],
      full_text: raw.full_text ?? raw.text ?? '',
      line_count: Array.isArray(lines) ? lines.length : 0,
      average_confidence: Array.isArray(lines) && lines.length > 0
        ? lines.reduce((s: number, l: { confidence?: number }) => s + (l.confidence ?? 0), 0) / lines.length
        : 0,
      image_path: raw.image_path,
      user_id: raw.user_id,
      title: raw.title,
      created_at: raw.created_at,
    };
    console.log('✅ OCR Result:', data);
    writeDebugLog({location:'api.ts:Success',message:'OCR result received',data:{hasData:!!data},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});

    return { success: true, data };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    const errorDetails = {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      url: fetchUrl,
    };
    console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2));
    writeDebugLog({location:'api.ts:Catch',message:'Catch block - error details',data:errorDetails,sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/** Backend base URL (so UI can show "Testing: <url>") */
export const getBackendBaseUrl = (): string => API_BASE_URL;

/**
 * Test if the backend is reachable. Use this to verify the app can reach the backend before using OCR.
 * @returns { reachable, message } - message explains success or the error (e.g. network, timeout)
 */
export const testBackendReachability = async (): Promise<{ reachable: boolean; message: string }> => {
  // Use /api/sync/health so we don't get 404 from root (e.g. ngrok or proxy)
  const url = `${API_BASE_URL}/api/sync/health`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      return { reachable: true, message: `Backend reachable at ${API_BASE_URL}` };
    }
    return { reachable: false, message: `Backend returned ${response.status} at ${API_BASE_URL}` };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const isAbort = err.includes('abort') || err === 'AbortError';
    const isNetwork = err.includes('Network') || err.includes('fetch') || err.includes('Failed to load');
    let reason = 'Unknown error';
    if (isAbort) reason = 'Timeout (10s) – backend too slow or unreachable';
    else if (isNetwork) reason = 'Network error – phone cannot reach the backend (check same WiFi, firewall, URL)';
    else reason = err;
    return { reachable: false, message: `${reason}. URL: ${API_BASE_URL}` };
  }
};

/**
 * Test if the backend is reachable (legacy boolean return)
 */
export const testConnection = async (): Promise<boolean> => {
  const { reachable } = await testBackendReachability();
  return reachable;
};

/**
 * Export OCR text to Word document and download to device
 * @param text - Text content to export
 * @param title - Document title
 * @param downloadPath - Local path to save the file
 * @returns Success status with file path or error
 */
export const exportToWord = async (
  text: string,
  title: string = 'Smart Notebook Export',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    console.log('📤 Exporting to Word...');
    console.log('📥 Download path:', downloadPath);

    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Cannot export empty text',
      };
    }

    const requestBody = {
      text: text.trim(),
      title: title || 'Smart Notebook Export',
    };

    const response = await fetch(`${API_BASE_URL}/api/notes/export/word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Export error:', errorText);
      let errorMessage = `Export failed: ${response.status}`;
      if (response.status === 422) {
        errorMessage = 'Invalid request format. Please try again.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid data. Please check your content.';
      }
      throw new Error(errorMessage);
    }

    // Get response as blob and convert to base64
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Write base64 data to file
    await RNFS.writeFile(downloadPath, base64, 'base64');

    console.log('✅ Word document saved to:', downloadPath);
    return {success: true, filePath: downloadPath};
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
};

/**
 * Export OCR text to PDF document and download to device
 * @param text - Text content to export
 * @param title - Document title
 * @param downloadPath - Local path to save the file
 * @returns Success status with file path or error
 */
export const exportToPDF = async (
  text: string,
  title: string = 'Smart Notebook Export',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    console.log('📤 Exporting to PDF...');
    console.log('📥 Download path:', downloadPath);

    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Cannot export empty text',
      };
    }

    const requestBody = {
      text: text.trim(),
      title: title || 'Smart Notebook Export',
    };

    const response = await fetch(`${API_BASE_URL}/api/notes/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Export error:', errorText);
      let errorMessage = `Export failed: ${response.status}`;
      if (response.status === 422) {
        errorMessage = 'Invalid request format. Please try again.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid data. Please check your content.';
      }
      throw new Error(errorMessage);
    }

    // Get response as blob and convert to base64
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Write base64 data to file
    await RNFS.writeFile(downloadPath, base64, 'base64');

    console.log('✅ PDF document saved to:', downloadPath);
    return {success: true, filePath: downloadPath};
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
};

/**
 * Convert blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Export multiple notes as a single Word or PDF document
 * @param noteIds - Array of note IDs to export
 * @param title - Document title
 * @param format - "word" or "pdf"
 * @param downloadPath - Local path to save the file
 * @returns Success status with file path or error
 */
export const exportBulkNotes = async (
  noteIds: number[],
  title: string = 'Smart Notebook - Multiple Notes',
  format: 'word' | 'pdf' = 'word',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    console.log(`📤 Exporting ${noteIds.length} notes as ${format.toUpperCase()}...`);
    console.log('📥 Download path:', downloadPath);

    // Get notes from local database
    const notes = [];
    for (const id of noteIds) {
      const note = await getNoteById(id);
      if (note) {
        notes.push({
          title: note.title || 'Untitled',
          text: note.corrected_text || note.original_ocr_text || '',
        });
      }
    }

    if (notes.length === 0) {
      return {
        success: false,
        error: 'No notes found to export',
      };
    }

    // Validate notes data
    const validNotes = notes.map(note => ({
      title: note.title || 'Untitled',
      text: note.text || '',
    })).filter(note => note.text.trim().length > 0);

    if (validNotes.length === 0) {
      return {
        success: false,
        error: 'No valid notes found to export',
      };
    }

    // Send note content to backend for export
    const response = await fetch(`${API_BASE_URL}/api/notes/export/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: validNotes,
        title: title || 'Smart Notebook - Multiple Notes',
        format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Export error:', errorText);
      let errorMessage = `Export failed: ${response.status}`;
      if (response.status === 422) {
        errorMessage = 'Invalid request format. Please try again.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid data. Please check your content.';
      }
      throw new Error(errorMessage);
    }

    // Get response as blob and convert to base64
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Write base64 data to file
    await RNFS.writeFile(downloadPath, base64, 'base64');

    console.log(`✅ Bulk ${format.toUpperCase()} document saved to:`, downloadPath);
    return {success: true, filePath: downloadPath};
  } catch (error) {
    console.error('❌ Bulk export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
};
