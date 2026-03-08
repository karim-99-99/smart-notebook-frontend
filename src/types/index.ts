export interface OCRResult {
  id?: number;
  text: string;
  lines: Array<{
    text: string;
    confidence: number;
  }>;
  full_text: string;
  line_count: number;
  average_confidence?: number;
  image_path?: string;
  user_id?: number;
  title?: string;
  created_at?: string;
}

export interface UploadResponse {
  success: boolean;
  data?: OCRResult;
  error?: string;
}

