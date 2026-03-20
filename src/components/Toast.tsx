import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

let toastCallback: ((message: string, type?: Toast['type']) => void) | null = null;

export function showToast(message: string, type: Toast['type'] = 'info') {
  if (toastCallback) {
    toastCallback(message, type);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    toastCallback = addToast;
    return () => {
      toastCallback = null;
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'px-6 py-3 rounded-lg text-sm font-medium text-white shadow-lg',
            'animate-fade-in pointer-events-auto',
            toast.type === 'error' && 'bg-red-600',
            toast.type === 'success' && 'bg-green-600',
            toast.type === 'info' && 'bg-gray-900'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
