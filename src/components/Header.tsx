import { cn } from '../lib/utils';
import { User, LogOut } from 'lucide-react';

interface HeaderProps {
  className?: string;
  onHome?: () => void;
  username?: string;
  onLogout?: () => void;
}

export function Header({ className, onHome, username, onLogout }: HeaderProps) {
  return (
    <>
      <header
        className={cn(
          'h-[60px] bg-white border-b border-default flex items-center justify-between px-6',
          'fixed top-0 left-0 right-0 z-50',
          className
        )}
      >
        <div className="flex items-center gap-8">
          {/* Logo */}
          <button
            onClick={onHome}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
              <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" fill="#4861ff" />
              <path d="M24 14L12 20v12l12 6 12-6V20L24 14z" fill="#fff" />
            </svg>
            <span className="text-lg font-semibold">DML PaperChecking</span>
          </button>

          {/* Nav Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={onHome}
              className="text-sm font-medium text-muted hover:text-primary transition-colors cursor-pointer"
            >
              主页
            </button>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {username && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-primary" />
                <span>{username}</span>
              </div>
              <button
                onClick={onLogout}
                title="退出登录"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          )}
        </div>
      </header>

    </>
  );
}
