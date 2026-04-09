import { useState, useEffect, useRef, useCallback } from 'react';
import { uploadFile, getTaskStatus, getFileList, getOcrResult, getActiveTasks } from '../api';
import type { Task, FileInfo, OcrResult } from '../types';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const data = await uploadFile(file, (pct) => setUploadProgress(pct));
      if (data.success && data.task_id) {
        setUploadProgress(100);
        setCurrentTask({
          id: data.task_id,
          filename: data.filename || file.name,
          status: 'processing',
          progress: 0,
          stage: 'Initializing...',
          created_at: new Date().toISOString(),
        });
        return data.task_id;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading, uploadProgress, currentTask, setCurrentTask, error };
}

export function useTaskPolling(taskId: string | null, onComplete?: (result: OcrResult) => void) {
  const [task, setTask] = useState<Task | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!taskId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTask(null);
      return;
    }

    const poll = async () => {
      try {
        const taskData = await getTaskStatus(taskId);
        setTask(taskData);

        if (taskData.status === 'completed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (onComplete) {
            const result = await getOcrResult(taskData.file_id ?? taskId);
            onComplete(result as OcrResult);
          }
        } else if (taskData.status === 'error') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    intervalRef.current = setInterval(poll, 2000) as unknown as number;
    poll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, onComplete]);

  return task;
}

export function useFileList() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFileList();
      setFiles(data.files ?? []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { files, isLoading, refresh };
}

export function useActiveTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await getActiveTasks();
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { tasks, refresh };
}

export function useOcrResult(_fileId: string | null) {
  const [result] = useState<OcrResult | null>(null);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const load = useCallback(async (_id: string) => {
    return null;
  }, []);

  return { result, isLoading, error, load };
}

/** 全屏工具页：禁止 html/body 再滚动（与内部面板滚动条分离）。离开页面时恢复。 */
export function useLockDocumentScroll() {
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);
}
