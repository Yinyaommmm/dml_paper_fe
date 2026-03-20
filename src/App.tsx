import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { ProgressPanel } from './components/ProgressPanel';
import { FileList } from './components/FileList';
import { DocumentView } from './components/DocumentView';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, showToast } from './components/Toast';
import { useFileUpload, useTaskPolling, useFileList, useActiveTasks } from './hooks';
import { isAuthenticated, getUsername, clearAuth } from './auth';
import type { OcrResult } from './types';
import './index.css';

function App() {
  const [page, setPage] = useState<'landing' | 'app'>('landing');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState(getUsername);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | undefined>();

  // Sync page state with browser history so the back button works
  const navigateTo = useCallback((target: 'landing' | 'app') => {
    if (target === 'app') {
      window.history.pushState({ page: 'app' }, '');
    } else {
      window.history.pushState({ page: 'landing' }, '');
    }
    setPage(target);
  }, []);

  useEffect(() => {
    window.history.replaceState({ page: 'landing' }, '');
    const handlePop = (e: PopStateEvent) => {
      const target = (e.state as { page?: string })?.page;
      setPage(target === 'app' ? 'app' : 'landing');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleEnterApp = useCallback(() => {
    if (isAuthenticated()) {
      navigateTo('app');
    } else {
      setShowLogin(true);
    }
  }, [navigateTo]);

  const handleLoginSuccess = useCallback(() => {
    setUsername(getUsername());
    setShowLogin(false);
    navigateTo('app');
  }, [navigateTo]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setUsername(null);
    navigateTo('landing');
  }, [navigateTo]);

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
      [currentTask, refreshFiles, refreshTasks]
    )
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
    [upload]
  );

  const handleSelectFile = useCallback((fileId: string, filename?: string) => {
    setCurrentFileId(fileId);
    setCurrentFilename(filename);
  }, []);

  if (page === 'landing') {
    return (
      <>
        <LandingPage onEnterApp={handleEnterApp} onLogin={() => setShowLogin(true)} username={username} onLogout={handleLogout} />
        <LoginModal
          open={showLogin}
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        onHome={() => navigateTo('landing')}
        username={username ?? undefined}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex pt-[60px] overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
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
                const f = files.find(x => x.file_id === fileId);
                handleSelectFile(fileId, f?.filename);
              }}
              onRefresh={refreshFiles}
              activeTasks={activeTasks}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-muted overflow-hidden min-h-0">
            {/* Document view or empty state */}
            {currentFileId ? (
              <DocumentView fileId={currentFileId} filename={currentFilename} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">📄</span>
                  </div>
                  <p className="text-sm">从左侧选择一个已完成的 PDF</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
