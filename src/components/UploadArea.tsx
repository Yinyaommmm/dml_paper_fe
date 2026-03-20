import { useCallback, useState } from 'react';
import { cn } from '../lib/utils';
import { Upload } from 'lucide-react';

interface UploadAreaProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadArea({ onUpload, disabled, className }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          onUpload(file);
        }
      }
    },
    [disabled, onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = e.target.files;
      if (files && files.length > 0) {
        onUpload(files[0]);
      }
    },
    [disabled, onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'm-4 p-10 border-2 border-dashed border-default rounded-lg',
        'flex flex-col items-center justify-center text-center',
        'transition-all duration-300 cursor-pointer',
        'hover:border-primary hover:bg-primary/[0.02]',
        isDragOver && 'border-primary bg-primary/[0.02]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center cursor-pointer w-full"
      >
        <Upload className="w-12 h-12 text-gray-400 mb-3" />
        <span className="text-muted text-sm">Click or drag file here</span>
        <span className="text-gray-400 text-xs mt-1">Support PDF files</span>
      </label>
    </div>
  );
}
