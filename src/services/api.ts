// import {OCRResult, UploadResponse} from '../types';
// import type {NotebookQRData} from '../utils/qrCodeParser';

// // IMPORTANT: Replace with your computer's IP address
// // Find it using: ipconfig (Windows) or ifconfig (Mac/Linux)
// // Use WiFi IP address - phone connects via WiFi to your computer
// // const API_BASE_URL = 'https://wanting-literacy-fork-applications.trycloudflare.com'; // Your computer's WiFi IP
// // const OCR_SERVICE_URL = 'https://wanting-literacy-fork-applications.trycloudflare.com'; // Direct OCR service (no auth required)
// const API_BASE_URL = 'https://wanting-literacy-fork-applications.trycloudflare.com';
// const OCR_SERVICE_URL = 'https://wanting-literacy-fork-applications.trycloudflare.com';
// // #region agent log
// const RNFS = require('react-native-fs');
// const DEBUG_LOG_PATH = `${RNFS.DocumentDirectoryPath}/debug.log`;
// console.log('🔍 Debug log path:', DEBUG_LOG_PATH);
// const writeDebugLog = (logData: any) => {
//   const logLine = JSON.stringify({...logData, timestamp: Date.now()}) + '\n';
//   RNFS.appendFile(DEBUG_LOG_PATH, logLine, 'utf8').catch(() => {});
// };
// // #endregion

// // TODO: Get a real auth token from backend
// // For now, we'll use a hardcoded test token
// // To get a token:
// // 1. Register: POST http://localhost:8000/api/auth/register
// // 2. Login: POST http://localhost:8000/api/auth/login
// // 3. Copy the access_token and paste it here
// const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGVAdGVzdC5jb20iLCJleHAiOjE3NjU0ODYyNTd9.A-p4dJ5UGsDaG-qYW8hDELYsudBw5mpsK4xYwCF6VGM"; // WORKING token - tested Dec 2025

// /**
//  * Upload an image to the backend for OCR processing
//  * @param imageUri - Local file URI of the captured image
//  * @param qrData - Optional QR code data for auto-configuration
//  * @returns OCR result with extracted text
//  */
// export const uploadImageForOCR = async (
//   imageUri: string,
//   qrData?: NotebookQRData,
// ): Promise<UploadResponse> => {
//   const fetchUrl = `${OCR_SERVICE_URL}/ocr`;
//   // #region agent log
//   writeDebugLog({location:'api.ts:22',message:'uploadImageForOCR entry',data:{imageUri,ocrServiceUrl:OCR_SERVICE_URL,fetchUrl},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
//   // #endregion
//   try {
//     console.log('📤 Uploading image:', imageUri);

//     // Create FormData for file upload
//     const formData = new FormData();
//     formData.append('file', {
//       uri: imageUri,
//       type: 'image/jpeg',
//       name: 'notebook.jpg',
//     } as any);
    
//     // Add QR code data if available (for auto-configuration)
//     if (qrData) {
//       formData.append('language_hint', qrData.language_hint);
//       formData.append('layout', qrData.layout);
//       formData.append('notebook_id', qrData.notebook_id);
//       formData.append('page_number', String(qrData.page_number));
//       console.log('📋 QR Data passed to OCR:', qrData);
//     }
//     // #region agent log
//     writeDebugLog({location:'api.ts:32',message:'FormData created',data:{imageUri,hasFormData:!!formData},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
//     // #endregion

//     // Call OCR service directly (no authentication required!)
//     console.log('🔗 Calling OCR Service at:', fetchUrl);
//     const fetchOptions = {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         // Don't set Content-Type - let fetch set it automatically with boundary
//       },
//       body: formData,
//     };
//     // #region agent log
//     writeDebugLog({location:'api.ts:44',message:'Before fetch call',data:{url:fetchUrl,method:fetchOptions.method,hasBody:!!fetchOptions.body},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
//     // #endregion
    
//     // Add timeout (60 seconds for OCR processing)
//     const TIMEOUT_MS = 60000;
//     const fetchStartTime = Date.now();
//     let response;
//     let timeoutId: NodeJS.Timeout | null = null;
    
//     try {
//       const fetchPromise = fetch(fetchUrl, fetchOptions);
//       const timeoutPromise = new Promise<never>((_, reject) => {
//         timeoutId = setTimeout(() => {
//           reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`));
//         }, TIMEOUT_MS);
//       });
      
//       response = await Promise.race([fetchPromise, timeoutPromise]);
      
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     } catch (fetchError) {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//       const fetchDuration = Date.now() - fetchStartTime;
//       console.error('❌ Fetch exception:', fetchError);
//       // #region agent log
//       writeDebugLog({location:'api.ts:66',message:'Fetch exception caught',data:{errorType:fetchError?.constructor?.name,errorMessage:fetchError instanceof Error ? fetchError.message : String(fetchError),fetchDuration,url:fetchUrl,errorString:String(fetchError),isTimeout:fetchError instanceof Error && fetchError.message.includes('timeout')},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
//       // #endregion
//       throw fetchError;
//     }
//     const fetchDuration = Date.now() - fetchStartTime;
//     // #region agent log
//     writeDebugLog({location:'api.ts:46',message:'After fetch call',data:{status:response.status,statusText:response.statusText,ok:response.ok,fetchDuration},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
//     // #endregion

//     console.log('📥 Response status:', response.status);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ API Error:', errorText);
//       // #region agent log
//       writeDebugLog({location:'api.ts:52',message:'HTTP error response',data:{status:response.status,errorText},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
//       // #endregion
//       throw new Error(`API Error: ${response.status} - ${errorText}`);
//     }

//     const data: OCRResult = await response.json();
//     console.log('✅ OCR Result:', data);
//     // #region agent log
//     writeDebugLog({location:'api.ts:58',message:'Success - OCR result received',data:{hasData:!!data},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
//     // #endregion

//     return {
//       success: true,
//       data,
//     };
//   } catch (error) {
//     console.error('❌ Upload failed:', error);
//     const errorDetails = {
//       errorType: error?.constructor?.name,
//       errorMessage: error instanceof Error ? error.message : String(error),
//       errorStack: error instanceof Error ? error.stack : undefined,
//       errorString: String(error),
//       url: fetchUrl,
//       ocrServiceUrl: OCR_SERVICE_URL,
//     };
//     console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2));
//     // #region agent log
//     writeDebugLog({location:'api.ts:64',message:'Catch block - error details',data:errorDetails,sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
//     // #endregion
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Upload failed',
//     };
//   }
// };

// /**
//  * Test if the backend is reachable
//  */
// export const testConnection = async (): Promise<boolean> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/`, {
//       method: 'GET',
//     });
//     return response.ok;
//   } catch (error) {
//     console.error('Connection test failed:', error);
//     return false;
//   }
// };

// /**
//  * Export OCR text to Word document and download to device
//  * @param text - Text content to export
//  * @param title - Document title
//  * @param downloadPath - Local path to save the file
//  * @returns Success status with file path or error
//  */
// export const exportToWord = async (
//   text: string,
//   title: string = 'Smart Notebook Export',
//   downloadPath: string,
// ): Promise<{success: boolean; filePath?: string; error?: string}> => {
//   try {
//     console.log('📤 Exporting to Word...');
//     console.log('📥 Download path:', downloadPath);

//     // Validate input
//     if (!text || text.trim().length === 0) {
//       return {
//         success: false,
//         error: 'Cannot export empty text',
//       };
//     }

//     const requestBody = {
//       text: text.trim(),
//       title: title || 'Smart Notebook Export',
//     };

//     const response = await fetch(`${API_BASE_URL}/api/notes/export/word`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ Export error:', errorText);
//       let errorMessage = `Export failed: ${response.status}`;
//       if (response.status === 422) {
//         errorMessage = 'Invalid request format. Please try again.';
//       } else if (response.status === 400) {
//         errorMessage = 'Invalid data. Please check your content.';
//       }
//       throw new Error(errorMessage);
//     }

//     // Get response as blob and convert to base64
//     const blob = await response.blob();
//     const base64 = await blobToBase64(blob);

//     // Import RNFS dynamically
//     const RNFS = require('react-native-fs');
    
//     // Write base64 data to file
//     await RNFS.writeFile(downloadPath, base64, 'base64');

//     console.log('✅ Word document saved to:', downloadPath);
//     return {success: true, filePath: downloadPath};
//   } catch (error) {
//     console.error('❌ Export failed:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Export failed',
//     };
//   }
// };

// /**
//  * Export OCR text to PDF document and download to device
//  * @param text - Text content to export
//  * @param title - Document title
//  * @param downloadPath - Local path to save the file
//  * @returns Success status with file path or error
//  */
// export const exportToPDF = async (
//   text: string,
//   title: string = 'Smart Notebook Export',
//   downloadPath: string,
// ): Promise<{success: boolean; filePath?: string; error?: string}> => {
//   try {
//     console.log('📤 Exporting to PDF...');
//     console.log('📥 Download path:', downloadPath);

//     // Validate input
//     if (!text || text.trim().length === 0) {
//       return {
//         success: false,
//         error: 'Cannot export empty text',
//       };
//     }

//     const requestBody = {
//       text: text.trim(),
//       title: title || 'Smart Notebook Export',
//     };

//     const response = await fetch(`${API_BASE_URL}/api/notes/export/pdf`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ Export error:', errorText);
//       let errorMessage = `Export failed: ${response.status}`;
//       if (response.status === 422) {
//         errorMessage = 'Invalid request format. Please try again.';
//       } else if (response.status === 400) {
//         errorMessage = 'Invalid data. Please check your content.';
//       }
//       throw new Error(errorMessage);
//     }

//     // Get response as blob and convert to base64
//     const blob = await response.blob();
//     const base64 = await blobToBase64(blob);

//     // Import RNFS dynamically
//     const RNFS = require('react-native-fs');
    
//     // Write base64 data to file
//     await RNFS.writeFile(downloadPath, base64, 'base64');

//     console.log('✅ PDF document saved to:', downloadPath);
//     return {success: true, filePath: downloadPath};
//   } catch (error) {
//     console.error('❌ Export failed:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Export failed',
//     };
//   }
// };

// /**
//  * Convert blob to base64 string
//  */
// const blobToBase64 = (blob: Blob): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const result = reader.result as string;
//       // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
//       const base64 = result.split(',')[1];
//       resolve(base64);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(blob);
//   });
// };

// /**
//  * Export multiple notes as a single Word or PDF document
//  * @param noteIds - Array of note IDs to export
//  * @param title - Document title
//  * @param format - "word" or "pdf"
//  * @param downloadPath - Local path to save the file
//  * @returns Success status with file path or error
//  */
// export const exportBulkNotes = async (
//   noteIds: number[],
//   title: string = 'Smart Notebook - Multiple Notes',
//   format: 'word' | 'pdf' = 'word',
//   downloadPath: string,
// ): Promise<{success: boolean; filePath?: string; error?: string}> => {
//   try {
//     console.log(`📤 Exporting ${noteIds.length} notes as ${format.toUpperCase()}...`);
//     console.log('📥 Download path:', downloadPath);

//     // Get notes from local database
//     const {getNoteById} = require('../services/database');
//     const notes = [];
//     for (const id of noteIds) {
//       const note = await getNoteById(id);
//       if (note) {
//         notes.push({
//           title: note.title || 'Untitled',
//           text: note.corrected_text || note.original_ocr_text || '',
//         });
//       }
//     }

//     if (notes.length === 0) {
//       return {
//         success: false,
//         error: 'No notes found to export',
//       };
//     }

//     // Validate notes data
//     const validNotes = notes.map(note => ({
//       title: note.title || 'Untitled',
//       text: note.text || '',
//     })).filter(note => note.text.trim().length > 0);

//     if (validNotes.length === 0) {
//       return {
//         success: false,
//         error: 'No valid notes found to export',
//       };
//     }

//     // Send note content to backend for export
//     const response = await fetch(`${_backendUrl}/api/notes/export/bulk`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         notes: validNotes,
//         title: title || 'Smart Notebook - Multiple Notes',
//         format,
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ Export error:', errorText);
//       let errorMessage = `Export failed: ${response.status}`;
//       if (response.status === 422) {
//         errorMessage = 'Invalid request format. Please try again.';
//       } else if (response.status === 400) {
//         errorMessage = 'Invalid data. Please check your content.';
//       }
//       throw new Error(errorMessage);
//     }

//     // Get response as blob and convert to base64
//     const blob = await response.blob();
//     const base64 = await blobToBase64(blob);

//     // Import RNFS dynamically
//     const RNFS = require('react-native-fs');
    
//     // Write base64 data to file
//     await RNFS.writeFile(downloadPath, base64, 'base64');

//     console.log(`✅ Bulk ${format.toUpperCase()} document saved to:`, downloadPath);
//     return {success: true, filePath: downloadPath};
//   } catch (error) {
//     console.error('❌ Bulk export failed:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Export failed',
//     };
//   }
// };

import {OCRResult, UploadResponse} from '../types';
import type {NotebookQRData} from '../utils/qrCodeParser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This URL is auto-patched by start-tunnel.sh every session.
// Do NOT manually edit – run ~/smart-notebook/start-tunnel.sh instead.
const DEFAULT_BACKEND_URL = 'https://logical-corner-combinations-laptop.trycloudflare.com';

const BACKEND_URL_STORAGE_KEY = 'backend_base_url';
const TOKEN_STORAGE_KEY = 'fastapi_auth_token';

// Always starts from the code constant (patched by script).
// Can be overridden at runtime via setBackendUrl() from the in-app modal.
let _backendUrl: string = DEFAULT_BACKEND_URL;

/** @deprecated No longer called at startup – script keeps DEFAULT_BACKEND_URL current. */
export const loadBackendUrl = async (): Promise<void> => {};

/**
 * Save a new backend URL to AsyncStorage and update the runtime variable.
 * Call this from the "Set Backend URL" settings dialog in the app.
 */
export const setBackendUrl = async (url: string): Promise<void> => {
  const trimmed = url.trim().replace(/\/$/, '');
  _backendUrl = trimmed;
  await AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, trimmed);
};

/** Returns the current backend URL (for display in UI). */
export const getBackendUrl = (): string => _backendUrl;

// Required header for Cloudflare/ngrok free-tier tunnels
const NGROK_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};

// #region agent log
const RNFS = require('react-native-fs');
const DEBUG_LOG_PATH = `${RNFS.DocumentDirectoryPath}/debug.log`;
console.log('🔍 Debug log path:', DEBUG_LOG_PATH);
const writeDebugLog = (logData: any) => {
  const logLine = JSON.stringify({...logData, timestamp: Date.now()}) + '\n';
  RNFS.appendFile(DEBUG_LOG_PATH, logLine, 'utf8').catch(() => {});
};
// #endregion

/**
 * Login to FastAPI backend and store token in AsyncStorage.
 * Call this right after Supabase login succeeds.
 * Backend expects POST with JSON body: { email, password }.
 */
export type BackendLoginResult = { ok: true } | { ok: false; error: string };

export const loginToBackend = async (
  email: string,
  password: string,
): Promise<BackendLoginResult> => {
  try {
    console.log('🔐 Logging into FastAPI backend...');
    const response = await fetch(`${_backendUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...NGROK_HEADERS,
      },
      body: JSON.stringify({ email, password }),
    });
    const raw = await response.text();
    if (!response.ok) {
      const err = raw ? `${response.status}: ${raw.slice(0, 150)}` : `HTTP ${response.status}`;
      console.warn('⚠️ Backend login failed:', err);
      return { ok: false, error: err };
    }
    let data: { access_token?: string };
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn('⚠️ Backend login: response was not JSON', raw.slice(0, 200));
      return { ok: false, error: 'Backend returned invalid response (not JSON).' };
    }
    if (data.access_token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      console.log('✅ FastAPI token stored successfully');
      return { ok: true };
    }
    console.warn('⚠️ No access_token in backend response:', data);
    return { ok: false, error: 'Backend did not return a token.' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Backend login failed:', error);
    return { ok: false, error: msg };
  }
};

/**
 * Register the same email/password in the backend so OCR works after signup.
 * Returns alreadyRegistered: true when user exists (caller can then sync password and retry login).
 */
export const registerBackend = async (
  email: string,
  password: string,
): Promise<{error?: string; alreadyRegistered?: boolean}> => {
  try {
    const response = await fetch(`${_backendUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...NGROK_HEADERS,
      },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) return {};
    const text = await response.text();
    if (response.status === 400 && (text.includes('already registered') || text.includes('Email already'))) {
      return { alreadyRegistered: true };
    }
    console.warn('⚠️ Backend register failed:', response.status, text);
    return { error: text || 'Backend registration failed' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Backend registration failed:', error);
    return { error: msg };
  }
};

/**
 * Sync backend password for an existing user (e.g. after Supabase password change).
 * Call when login fails with 401 and register returns "already registered".
 */
export const syncBackendPassword = async (email: string, password: string): Promise<{error?: string}> => {
  try {
    const res = await fetch(`${_backendUrl}/api/sync-password`, {
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
 * Get stored FastAPI token from AsyncStorage
 */
export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Clear stored token (call on logout)
 */
export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Upload an image to the backend for OCR processing
 */
export const uploadImageForOCR = async (
  imageUri: string,
  qrData?: NotebookQRData,
): Promise<UploadResponse> => {
  const fetchUrl = `${_backendUrl}/api/notes/ocr`;
  writeDebugLog({location: 'api.ts:22', message: 'uploadImageForOCR entry', data: {imageUri, fetchUrl}});

  try {
    console.log('📤 Uploading image:', imageUri);

    // Get stored auth token (set when you log in; backend login runs after Supabase login)
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ No auth token - backend login may have failed. Log out and log in again.');
      return {
        success: false,
        error: 'Not logged in to backend. Go to Login, sign in (or log out and log in again), then try Send to OCR. Check that the app can reach the backend.',
      };
    }

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

    const fetchOptions = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...NGROK_HEADERS,
      },
      body: formData,
    };

    writeDebugLog({location: 'api.ts:44', message: 'Before fetch call', data: {url: fetchUrl}});

    const TIMEOUT_MS = 60000;
    const fetchStartTime = Date.now();
    let response;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const fetchPromise = fetch(fetchUrl, fetchOptions);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`));
        }, TIMEOUT_MS);
      });
      response = await Promise.race([fetchPromise, timeoutPromise]);
      if (timeoutId) {clearTimeout(timeoutId);}
    } catch (fetchError) {
      if (timeoutId) {clearTimeout(timeoutId);}
      console.error('❌ Fetch exception:', fetchError);
      writeDebugLog({location: 'api.ts:66', message: 'Fetch exception', data: {error: String(fetchError)}});
      const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new Error(`Check connection to backend or log in. ${msg}`);
    }

    const fetchDuration = Date.now() - fetchStartTime;
    writeDebugLog({location: 'api.ts:46', message: 'After fetch', data: {status: response.status, fetchDuration}});
    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      writeDebugLog({location: 'api.ts:52', message: 'HTTP error', data: {status: response.status, errorText}});
      if (response.status === 401) {
        await clearAuthToken();
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
    writeDebugLog({location: 'api.ts:58', message: 'OCR success', data: {hasData: !!data}});

    return {success: true, data};
  } catch (error) {
    console.error('❌ Upload failed:', error);
    const errorDetails = {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      url: fetchUrl,
    };
    writeDebugLog({location: 'api.ts:64', message: 'Catch block', data: errorDetails});
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Test if the backend is reachable
 */
/** Backend base URL (so UI can show "Testing: <url>") */
export const getBackendBaseUrl = (): string => _backendUrl;

/**
 * Test if the backend is reachable. Use this to verify the app can reach the backend before using OCR.
 */
export const testBackendReachability = async (): Promise<{ reachable: boolean; message: string }> => {
  // Use /api/sync/health so we don't get 404 from root (e.g. ngrok interstitial)
  const url = `${_backendUrl}/api/sync/health`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method: 'GET',
      headers: {...NGROK_HEADERS},
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return { reachable: true, message: `Backend reachable at ${_backendUrl}` };
    }
    return { reachable: false, message: `Backend returned ${response.status} at ${_backendUrl}` };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const isAbort = err.includes('abort') || err === 'AbortError';
    const isNetwork = err.includes('Network') || err.includes('fetch') || err.includes('Failed to load');
    let reason = 'Unknown error';
    if (isAbort) reason = 'Timeout (10s) – backend too slow or unreachable';
    else if (isNetwork) reason = 'Network error – phone cannot reach the backend (check internet, tunnel URL)';
    else reason = err;
    return { reachable: false, message: `${reason}. URL: ${_backendUrl}` };
  }
};

export const testConnection = async (): Promise<boolean> => {
  const { reachable } = await testBackendReachability();
  return reachable;
};

/**
 * Export OCR text to Word document
 */
export const exportToWord = async (
  text: string,
  title: string = 'Smart Notebook Export',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    if (!text || text.trim().length === 0) {
      return {success: false, error: 'Cannot export empty text'};
    }
    const response = await fetch(`${_backendUrl}/api/notes/export/word`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...NGROK_HEADERS},
      body: JSON.stringify({text: text.trim(), title: title || 'Smart Notebook Export'}),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Export failed: ${response.status}`;
      if (response.status === 422) {errorMessage = 'Invalid request format. Please try again.';}
      else if (response.status === 400) {errorMessage = 'Invalid data. Please check your content.';}
      throw new Error(errorMessage);
    }
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const RNFS = require('react-native-fs');
    await RNFS.writeFile(downloadPath, base64, 'base64');
    return {success: true, filePath: downloadPath};
  } catch (error) {
    return {success: false, error: error instanceof Error ? error.message : 'Export failed'};
  }
};

/**
 * Export OCR text to PDF document
 */
export const exportToPDF = async (
  text: string,
  title: string = 'Smart Notebook Export',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    if (!text || text.trim().length === 0) {
      return {success: false, error: 'Cannot export empty text'};
    }
    const response = await fetch(`${_backendUrl}/api/notes/export/pdf`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...NGROK_HEADERS},
      body: JSON.stringify({text: text.trim(), title: title || 'Smart Notebook Export'}),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Export failed: ${response.status}`;
      if (response.status === 422) {errorMessage = 'Invalid request format. Please try again.';}
      else if (response.status === 400) {errorMessage = 'Invalid data. Please check your content.';}
      throw new Error(errorMessage);
    }
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const RNFS = require('react-native-fs');
    await RNFS.writeFile(downloadPath, base64, 'base64');
    return {success: true, filePath: downloadPath};
  } catch (error) {
    return {success: false, error: error instanceof Error ? error.message : 'Export failed'};
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
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Export multiple notes as a single Word or PDF document
 */
export const exportBulkNotes = async (
  noteIds: number[],
  title: string = 'Smart Notebook - Multiple Notes',
  format: 'word' | 'pdf' = 'word',
  downloadPath: string,
): Promise<{success: boolean; filePath?: string; error?: string}> => {
  try {
    const {getNoteById} = require('../services/database');
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
    if (notes.length === 0) {return {success: false, error: 'No notes found to export'};}
    const validNotes = notes
      .map(note => ({title: note.title || 'Untitled', text: note.text || ''}))
      .filter(note => note.text.trim().length > 0);
    if (validNotes.length === 0) {return {success: false, error: 'No valid notes found to export'};}
    const response = await fetch(`${_backendUrl}/api/notes/export/bulk`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...NGROK_HEADERS},
      body: JSON.stringify({notes: validNotes, title, format}),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const RNFS = require('react-native-fs');
    await RNFS.writeFile(downloadPath, base64, 'base64');
    return {success: true, filePath: downloadPath};
  } catch (error) {
    return {success: false, error: error instanceof Error ? error.message : 'Export failed'};
  }
};