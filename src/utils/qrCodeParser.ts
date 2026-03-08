/**
 * QR Code Parser - Notebook Metadata
 * Parses QR codes containing notebook configuration
 */

export interface NotebookQRData {
  notebook_id: string;
  page_number: number;
  layout: 'ruled' | 'grid' | 'blank';
  language_hint: 'ar' | 'en' | 'mixed';
}

/**
 * Parse QR code string to NotebookQRData
 */
export const parseQRCode = (qrString: string): NotebookQRData | null => {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    if (
      typeof data.notebook_id === 'string' &&
      typeof data.page_number === 'number' &&
      ['ruled', 'grid', 'blank'].includes(data.layout) &&
      ['ar', 'en', 'mixed'].includes(data.language_hint)
    ) {
      return {
        notebook_id: data.notebook_id,
        page_number: data.page_number,
        layout: data.layout,
        language_hint: data.language_hint,
      };
    }
    
    console.warn('⚠️ Invalid QR code format:', data);
    return null;
  } catch (error) {
    console.error('❌ Failed to parse QR code:', error);
    return null;
  }
};

/**
 * Generate QR code string from NotebookQRData
 */
export const generateQRCodeString = (data: NotebookQRData): string => {
  return JSON.stringify(data);
};

/**
 * Validate QR code data
 */
export const validateQRData = (data: any): data is NotebookQRData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.notebook_id === 'string' &&
    typeof data.page_number === 'number' &&
    ['ruled', 'grid', 'blank'].includes(data.layout) &&
    ['ar', 'en', 'mixed'].includes(data.language_hint)
  );
};

