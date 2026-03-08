import type {OCRResult} from '../types';
import type {NotebookQRData} from '../utils/qrCodeParser';

export type RootStackParamList = {
  Login: undefined;
  Scan: undefined;
  Preview: {
    photoPath: string;
    qrData?: NotebookQRData;
    qrCode?: string | null;
  };
  EditNote: {
    photoPath: string;
    ocrResult: OCRResult;
    noteId?: number;
    folderId?: number | null;
    qrData?: NotebookQRData;
  };
  Result: {
    ocrResult: OCRResult;
  };
  Folders: undefined;
  History: {
    folderId?: number | null;
  };
};

