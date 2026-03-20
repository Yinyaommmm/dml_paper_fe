import { cn } from '../lib/utils';
import { Progress } from './ui';
import type { Task } from '../types';

interface ProgressPanelProps {
  task: Task | null;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export function ProgressPanel({ task, isUploading, uploadProgress = 0, className }: ProgressPanelProps) {
  // ── Phase 1: uploading ──────────────────────────────────────
  if (isUploading) {
    return (
      <div className={cn('mx-4 my-3 p-4 bg-muted rounded-lg animate-fade-in flex-shrink-0', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">正在上传...</span>
          <span className="text-xs text-muted">{uploadProgress}%</span>
        </div>
        <Progress value={uploadProgress} />
        <div className="text-xs text-muted mt-2">
          {uploadProgress < 100 ? '文件传输中，请稍候' : '上传完成，准备处理...'}
        </div>
      </div>
    );
  }

  // ── Phase 2: OCR processing ─────────────────────────────────
  if (!task || task.status === 'completed' || task.status === 'error') {
    return null;
  }

  return (
    <div className={cn('mx-4 my-3 p-4 bg-muted rounded-lg animate-fade-in flex-shrink-0', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">正在解析...</span>
        <span className="text-xs text-muted">{task.progress}%</span>
      </div>
      <Progress value={task.progress} />
      <div className="text-xs text-muted mt-2 leading-relaxed break-words">{task.stage}</div>
    </div>
  );
}
