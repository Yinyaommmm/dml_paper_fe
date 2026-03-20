import { useState, useEffect } from 'react';
import { getLogs, getLogFiles, type LogFile } from '../api';
import { FileText, X, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<LogFile[]>([]);
  const [lines, setLines] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      loadLogFiles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lines]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getLogs(lines);
      if (data.success) {
        setContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogFiles = async () => {
    try {
      const data = await getLogFiles();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Failed to load log files:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted" />
            <span className="font-semibold">Server Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-default rounded"
            >
              <option value={50}>50 lines</option>
              <option value={100}>100 lines</option>
              <option value={200}>200 lines</option>
              <option value={500}>500 lines</option>
            </select>
            <button
              onClick={loadLogs}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Log content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-900">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {content || 'No logs available'}
            </pre>
          </div>

          {/* File list sidebar */}
          {files.length > 0 && (
            <div className="w-48 border-l border-default p-2 overflow-auto">
              <div className="text-xs font-medium text-muted mb-2 px-1">Log Files</div>
              {files.map((file) => (
                <div
                  key={file.name}
                  className="text-xs px-2 py-1.5 hover:bg-muted rounded cursor-pointer truncate"
                  title={file.name}
                >
                  {file.name.replace('app_', '').replace('.log', '')}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
