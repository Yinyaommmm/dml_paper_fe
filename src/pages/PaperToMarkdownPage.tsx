import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { UploadArea } from '../components/UploadArea';
import { ProgressPanel } from '../components/ProgressPanel';
import { FileList } from '../components/FileList';
import { MarkdownPaperView } from '../components/MarkdownPaperView';
import { showToast } from '../components/Toast';
import { useFileUpload, useTaskPolling, useFileList, useActiveTasks, useLockDocumentScroll } from '../hooks';
import { getUsername, clearAuth } from '../auth';
import type { OcrResult } from '../types';

export function PaperToMarkdownPage() {
  useLockDocumentScroll();
  const navigate = useNavigate();
  const [username] = useState(() => getUsername());
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | undefined>();

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate('/', { replace: true });
  }, [navigate]);

  const { upload, isUploading, uploadProgress, currentTask } = useFileUpload();
  const { files, refresh: refreshFiles } = useFileList();
  const { tasks: activeTasks, refresh: refreshTasks } = useActiveTasks();

  const task = useTaskPolling(
    currentTask?.id || null,
    useCallback(
      (_result: OcrResult) => {
        if (currentTask?.file_id) {
          setCurrentFileId(currentTask.file_id);
          setCurrentFilename(currentTask.filename);
        }
        refreshFiles();
        refreshTasks();
        showToast('处理完成！', 'success');
      },
      [currentTask, refreshFiles, refreshTasks],
    ),
  );

  const handleUpload = useCallback(
    async (file: File) => {
      const taskId = await upload(file);
      if (taskId) {
        showToast('上传成功，正在处理...', 'info');
      } else {
        showToast('上传失败', 'error');
      }
    },
    [upload],
  );

  const handleSelectFile = useCallback((fileId: string, filename?: string) => {
    setCurrentFileId(fileId);
    setCurrentFilename(filename);
  }, []);

  return (
    <div className="fixed inset-0 z-0 flex min-h-0 flex-col overflow-hidden">
      <Header
        brandTitle="DML Paper To Markdown"
        onHome={() => navigate('/')}
        username={username ?? undefined}
        onLogout={handleLogout}
      />

      {/* min-h-0：允许 flex 子项低于“内容自然高度”，否则整页会被撑高 → body 出现第二条滚动条与底部空白 */}
      <div className="flex-1 min-h-0 flex pt-[60px] overflow-hidden">
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="w-80 bg-white border-r border-default flex flex-col flex-shrink-0 min-h-0">
            <div className="px-5 py-4 border-b border-default flex-shrink-0">
              <h2 className="font-semibold">源文件</h2>
            </div>

            <UploadArea
              onUpload={handleUpload}
              disabled={isUploading || task?.status === 'processing'}
            />

            <ProgressPanel
              task={task}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />

            <FileList
              files={files}
              currentFileId={currentFileId}
              onSelect={(fileId) => {
                const f = files.find((x) => x.file_id === fileId);
                handleSelectFile(fileId, f?.filename);
              }}
              onRefresh={refreshFiles}
              activeTasks={activeTasks}
            />
          </div>

          <div className="flex-1 flex flex-col bg-muted overflow-hidden min-h-0">
            {currentFileId ? (
              <MarkdownPaperView fileId={currentFileId} filename={currentFilename} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="text-sm">从左侧选择一个已完成的 PDF</p>
                  <p className="text-xs text-gray-400 mt-2 max-w-xs">
                    与 Reference Checking 共用上传与解析；完成后即可查看 Markdown 与插图。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
