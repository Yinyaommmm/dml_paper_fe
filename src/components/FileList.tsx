import { useState } from 'react';
import { cn, formatDate } from '../lib/utils';
import { FileText, Clock, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import type { FileInfo, Task } from '../types';
import { deleteFile, rerunFile } from '../api';
import { showToast } from './Toast';
import { Progress } from './ui';

interface FileListProps {
  files: FileInfo[];
  currentFileId: string | null;
  onSelect: (fileId: string) => void;
  onRefresh?: () => void;
  activeTasks?: Task[];
  isLoading?: boolean;
  className?: string;
}

export function FileList({
  files,
  currentFileId,
  onSelect,
  onRefresh,
  activeTasks = [],
  isLoading,
  className,
}: FileListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;

    setActionLoading(fileId);
    try {
      await deleteFile(fileId);
      showToast('File deleted', 'success');
      onRefresh?.();
    } catch {
      showToast('Failed to delete file', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRerun = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setActionLoading(fileId);
    try {
      const result = await rerunFile(fileId);
      if (result.success) {
        showToast('File re-processed', 'success');
        onRefresh?.();
        onSelect(fileId);
      }
    } catch {
      showToast('Failed to re-process file', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className={cn('flex-1 flex flex-col items-center justify-center text-muted p-8', className)}>
        <FileText className="w-12 h-12 mb-2 opacity-30" />
        <span className="text-sm">暂无文件</span>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto scrollbar-thin', className)}>
      {files.map((file) => {
        const isActive = file.file_id === currentFileId;
        const fileName = file.filename.replace(/\.[^/.]+$/, '');
        const fileExt = file.filename.match(/\.[^/.]+$/)?.[0] || '';
        const isProcessing = actionLoading === file.file_id;

        const activeTask = activeTasks.find((t) => t.file_id === file.file_id);
        const isTaskProcessing = activeTask && activeTask.status === 'processing';

        return (
          <div
            key={file.file_id}
            onClick={() => onSelect(file.file_id)}
            className={cn(
              'group w-full px-4 py-3 text-left border-l-[3px] transition-all cursor-pointer',
              'hover:bg-primary/5',
              isActive
                ? 'bg-primary/[0.05] border-l-primary'
                : 'border-l-transparent'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium truncate flex-1 text-foreground">
                {fileName}
              </span>
              <span className="text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {fileExt}
              </span>
            </div>

            {/* Progress bar for active task */}
            {isTaskProcessing && activeTask && (
              <div className="mb-2">
                <div className="text-xs text-primary mb-1">
                  {activeTask.stage} ({activeTask.progress}%)
                </div>
                <Progress value={activeTask.progress} className="h-1.5" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(file.created_at)}
                </span>
                <span>·</span>
                <span>{file.pages || 0} 页</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleRerun(e, file.file_id)}
                  disabled={isProcessing}
                  className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                  title="重新处理"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={(e) => handleDelete(e, file.file_id)}
                  disabled={isProcessing}
                  className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
