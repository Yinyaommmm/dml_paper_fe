import type { Task, FileInfo, OcrResult, UploadResponse } from '../types';
import { getToken } from '../auth';

const API_BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        reject(new Error('Invalid response'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));

    xhr.open('POST', `${API_BASE}/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ─── Task polling ─────────────────────────────────────────────────────────────

export async function getTaskStatus(taskId: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/task/${taskId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Task ${taskId} not found`);
  return res.json();
}

export async function getActiveTasks(): Promise<{ tasks: Task[] }> {
  const res = await fetch(`${API_BASE}/tasks`, { headers: authHeaders() });
  const data = await res.json();
  return { tasks: data.tasks ?? [] };
}

// ─── File list ────────────────────────────────────────────────────────────────

export async function getFileList(): Promise<{ files: FileInfo[] }> {
  const res = await fetch(`${API_BASE}/files`, { headers: authHeaders() });
  const data = await res.json();
  return { files: data.files ?? [] };
}

// ─── OCR result (not served via REST in this backend) ─────────────────────────

export async function getOcrResult(_fileId: string): Promise<OcrResult | null> {
  return null;
}

// ─── Delete / Rerun ───────────────────────────────────────────────────────────

export async function deleteFile(fileId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}

export async function rerunFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/files/${fileId}/rerun`, { method: 'POST', headers: authHeaders() });
  return res.json();
}

// ─── References ───────────────────────────────────────────────────────────────

export interface ReferenceResult {
  ref_num: number;
  original_text: string;
  extracted_title: string | null;
  doi: string | null;
  status: string;
  verification_status: string;
  message: string;
  relevance_score: number | null;
  cited_by_count: number | null;
}

export function getPdfUrl(fileId: string): string {
  return `/api/files/${fileId}/pdf`;
}

export async function getReferences(fileId: string): Promise<{
  total: number;
  valid: number;
  invalid: number;
  results: ReferenceResult[];
}> {
  const res = await fetch(`${API_BASE}/files/${fileId}/references`, { headers: authHeaders() });
  return res.json();
}

export async function verifyReferences(fileId: string): Promise<{ success: boolean; message: string; total: number }> {
  const res = await fetch(`${API_BASE}/files/${fileId}/verify-references`, { method: 'POST', headers: authHeaders() });
  return res.json();
}

export interface VerifyProgress {
  status: 'not_started' | 'processing' | 'completed';
  progress: number;
  current: number;
  total: number;
}

export async function getVerifyProgress(fileId: string): Promise<VerifyProgress> {
  const res = await fetch(`${API_BASE}/files/${fileId}/verify-progress`, { headers: authHeaders() });
  return res.json();
}

export async function humanVerifyReference(
  fileId: string,
  refNum: number,
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${API_BASE}/files/${fileId}/references/${refNum}/human-verify`,
    { method: 'POST', headers: authHeaders() },
  );
  return res.json();
}

// ─── Paper → Markdown ─────────────────────────────────────────────────────────

export interface MarkdownPayload {
  task_id: string;
  ready: boolean;
  markdown: string | null;
  assets_base_path: string;
  md_filename: string;
  meta?: unknown;
  message?: string;
}

export async function getMarkdown(fileId: string): Promise<MarkdownPayload> {
  const res = await fetch(`${API_BASE}/files/${fileId}/markdown`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Markdown ${res.status}`);
  }
  return res.json();
}

// ─── Logs (not available) ─────────────────────────────────────────────────────

export interface LogFile {
  name: string;
  size: number;
  modified: string;
}

export async function getLogs(_lines: number = 100): Promise<{ success: boolean; content: string; lines: number }> {
  return { success: false, content: '(Log API not available in this backend)', lines: 0 };
}

export async function getLogFiles(): Promise<{ success: boolean; files: LogFile[] }> {
  return { success: false, files: [] };
}
