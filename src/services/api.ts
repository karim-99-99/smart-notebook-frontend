import {OCRResult, UploadResponse} from '../types';
import type {NotebookQRData} from '../utils/qrCodeParser';

// IMPORTANT: Replace with your computer's IP address
// Find it using: ipconfig (Windows) or ifconfig (Mac/Linux)
// Use WiFi IP address - phone connects via WiFi to your computer
const API_BASE_URL = 'http://172.20.10.2:8000'; // Your computer's WiFi IP
const OCR_SERVICE_URL = 'http://172.20.10.2:9000'; // Direct OCR service (no auth required)

// #region agent log
const RNFS = require('react-native-fs');
const DEBUG_LOG_PATH = `${RNFS.DocumentDirectoryPath}/debug.log`;
console.log('🔍 Debug log path:', DEBUG_LOG_PATH);
const writeDebugLog = (logData: any) => {
  const logLine = JSON.stringify({...logData, timestamp: Date.now()}) + '\n';
  RNFS.appendFile(DEBUG_LOG_PATH, logLine, 'utf8').catch(() => {});
};
// #endregion

// TODO: Get a real auth token from backend
// For now, we'll use a hardcoded test token
// To get a token:
// 1. Register: POST http://localhost:8000/api/auth/register
// 2. Login: POST http://localhost:8000/api/auth/login
// 3. Copy the access_token and paste it here
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGVAdGVzdC5jb20iLCJleHAiOjE3NjU0ODYyNTd9.A-p4dJ5UGsDaG-qYW8hDELYsudBw5mpsK4xYwCF6VGM"; // WORKING token - tested Dec 2025

/**
 * Upload an image to the backend for OCR processing
 * @param imageUri - Local file URI of the captured image
 * @param qrData - Optional QR code data for auto-configuration
 * @returns OCR result with extracted text
 */
export const uploadImageForOCR = async (
  imageUri: string,
  qrData?: NotebookQRData,
): Promise<UploadResponse> => {
  const fetchUrl = `${OCR_SERVICE_URL}/ocr`;
  // #region agent log
  writeDebugLog({location:'api.ts:22',message:'uploadImageForOCR entry',data:{imageUri,ocrServiceUrl:OCR_SERVICE_URL,fetchUrl},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  // #endregion
  try {
    console.log('📤 Uploading image:', imageUri);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'notebook.jpg',
    } as any);
    
    // Add QR code data if available (for auto-configuration)
    if (qrData) {
      formData.append('language_hint', qrData.language_hint);
      formData.append('layout', qrData.layout);
      formData.append('notebook_id', qrData.notebook_id);
      formData.append('page_number', String(qrData.page_number));
      console.log('📋 QR Data passed to OCR:', qrData);
    }
    // #region agent log
    writeDebugLog({location:'api.ts:32',message:'FormData created',data:{imageUri,hasFormData:!!formData},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
    // #endregion

    // Call OCR service directly (no authentication required!)
    console.log('🔗 Calling OCR Service at:', fetchUrl);
    const fetchOptions = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        // Don't set Content-Type - let fetch set it automatically with boundary
      },
      body: formData,
    };
    // #region agent log
    writeDebugLog({location:'api.ts:44',message:'Before fetch call',data:{url:fetchUrl,method:fetchOptions.method,hasBody:!!fetchOptions.body},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    // Add timeout (60 seconds for OCR processing)
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
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } catch (fetchError) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const fetchDuration = Date.now() - fetchStartTime;
      console.error('❌ Fetch exception:', fetchError);
      // #region agent log
      writeDebugLog({location:'api.ts:66',message:'Fetch exception caught',data:{errorType:fetchError?.constructor?.name,errorMessage:fetchError instanceof Error ? fetchError.message : String(fetchError),fetchDuration,url:fetchUrl,errorString:String(fetchError),isTimeout:fetchError instanceof Error && fetchError.message.includes('timeout')},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      // #endregion
      throw fetchError;
    }
    const fetchDuration = Date.now() - fetchStartTime;
    // #region agent log
    writeDebugLog({location:'api.ts:46',message:'After fetch call',data:{status:response.status,statusText:response.statusText,ok:response.ok,fetchDuration},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      // #region agent log
      writeDebugLog({location:'api.ts:52',message:'HTTP error response',data:{status:response.status,errorText},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      // #endregion
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data: OCRResult = await response.json();
    console.log('✅ OCR Result:', data);
    // #region agent log
    writeDebugLog({location:'api.ts:58',message:'Success - OCR result received',data:{hasData:!!data},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    const errorDetails = {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorString: String(error),
      url: fetchUrl,
      ocrServiceUrl: OCR_SERVICE_URL,
    };
    console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2));
    // #region agent log
    writeDebugLog({location:'api.ts:64',message:'Catch block - error details',data:errorDetails,sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
    // #endregion
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Test if the backend is reachable
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
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

    // Import RNFS dynamically
    const RNFS = require('react-native-fs');
    
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

    // Import RNFS dynamically
    const RNFS = require('react-native-fs');
    
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

    // Import RNFS dynamically
    const RNFS = require('react-native-fs');
    
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

