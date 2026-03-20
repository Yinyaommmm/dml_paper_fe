import { useState, useEffect, useRef } from 'react';
import { Loader2, X, LogIn, Eye, EyeOff } from 'lucide-react';
import { loginRequest } from '../auth';

interface LoginModalProps {
  open: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export function LoginModal({ open, onSuccess, onClose }: LoginModalProps) {
  const [username, setUsername]   = useState('dml');
  const [password, setPassword]   = useState('dml');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    const result = await loginRequest(username.trim(), password);
    setLoading(false);
    if (result.success) {
      setUsername('dml');
      setPassword('dml');
      onSuccess();
    } else {
      setError(result.error ?? '登录失败');
    }
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-indigo-400" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6">
                <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" fill="#4861ff"/>
                <path d="M24 14L12 20v12l12 6 12-6V20L24 14z" fill="#fff"/>
              </svg>
              <span className="text-sm font-semibold text-gray-500">DML Academic Tools</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">登录</h2>
            <p className="text-xs text-gray-400 mt-0.5">请先登录后使用工具</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">用户名</label>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />登录中...</>
              : <><LogIn className="w-4 h-4" />登 录</>}
          </button>
        </form>
      </div>
    </div>
  );
}
