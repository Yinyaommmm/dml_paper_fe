// OCR Block from backend
export interface OcrBlock {
  id: string;
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  points?: number[][];
  page: number;
  type?: string;
  image_url?: string;
  image_path?: string;
}

// Page data
export interface PageData {
  page_num: number;
  width: number;
  height: number;
  blocks: OcrBlock[];
}

// OCR Result from backend
export interface OcrResult {
  file_id: string;
  total_pages: number;
  pages: PageData[];
  markdown: string;
  text: string;
  json: {
    document: string;
    total_pages: number;
    model: string;
    version: string;
    pages: PageData[];
  };
}

// Task status
export interface Task {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  total_pages?: number;
  result?: OcrResult;
  file_id?: string;
  error?: string;
  created_at: string;
}

// File info
export interface FileInfo {
  file_id: string;
  filename: string;
  size: number;
  created_at: string;
  pages: number;
  status: string;
}

// Health check response
export interface HealthStatus {
  status: string;
  version: string;
  features: string[];
  gpu_available: boolean;
  device: string;
}

// Upload response
export interface UploadResponse {
  success: boolean;
  task_id?: string;
  filename?: string;
  status?: string;
  error?: string;
  ws_url?: string;
}
