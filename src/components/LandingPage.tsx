import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { TOOLS, type ToolDefinition } from '../routes/toolCatalog';

interface LandingPageProps {
  onLogin: () => void;
  username?: string | null;
  onLogout?: () => void;
}

export function LandingPage({ onLogin, username, onLogout }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col overflow-auto">
      {/* ── Navbar ── */}
      <header className="h-[60px] min-h-[60px] bg-white border-b border-gray-100 flex items-stretch justify-between px-8 sticky top-0 z-50 shadow-sm">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex h-full items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
            <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" fill="#4861ff"/>
            <path d="M24 14L12 20v12l12 6 12-6V20L24 14z" fill="#fff"/>
          </svg>
          <span className="text-lg font-semibold text-gray-900">DML Academic Tools</span>
        </Link>

        {username ? (
          <div className="flex h-full items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
              <User className="w-4 h-4 text-primary" />
              <span>{username}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="self-center px-5 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
          >
            Login
          </button>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 pb-12 text-center px-4">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">DML Lab · Academic Tools</p>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          DML PAPER TOOLS
        </h1>
        <p className="text-base text-gray-500 max-w-lg mx-auto">
          一套面向学术论文的智能处理工具集，助力文献解析与质量核查
        </p>
      </section>

      {/* ── Tool grid ── */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © 2026 DML Lab · All rights reserved
      </footer>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const [hovered, setHovered] = useState(false);
  const isReleased = tool.available;

  return (
    <Link
      to={tool.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative rounded-2xl overflow-hidden border h-64 transition-all duration-300 block no-underline',
        isReleased
          ? 'cursor-pointer border-gray-200 hover:shadow-xl hover:-translate-y-0.5'
          : 'cursor-pointer border-gray-100 opacity-60 hover:opacity-85 hover:shadow-md',
      )}
    >
      <div className="absolute inset-0 bg-white" />

      <div
        className="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300"
        style={{ opacity: hovered ? 0 : 1 }}
      >
        <h3 className={cn('text-sm font-semibold mb-1', isReleased ? 'text-gray-900' : 'text-gray-400')}>
          {tool.name}
        </h3>
        <p className={cn('text-xs leading-relaxed', isReleased ? 'text-gray-500' : 'text-gray-400')}>
          {tool.description}
        </p>
      </div>

      <div
        className={cn('absolute top-0 left-0 right-0 bg-gradient-to-br transition-all duration-300 ease-in-out flex items-center justify-center', tool.gradient)}
        style={{
          height: hovered ? '100%' : '68%',
          borderRadius: hovered ? '0' : '0 0 1rem 1rem',
        }}
      >
        <div
          style={{
            transform: hovered
              ? 'translateY(-18px) scale(1.18) rotate(8deg)'
              : 'translateY(0) scale(1) rotate(0deg)',
            transition: hovered
              ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 0.3s ease-in-out',
          }}
        >
          {tool.icon}
        </div>

        <span className={cn(
          'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm',
          isReleased ? 'bg-white/30 text-white' : 'bg-black/20 text-white/80',
        )}>
          {isReleased ? '可用' : '即将上线'}
        </span>

        <div
          className="absolute bottom-5 left-0 right-0 flex justify-center transition-all duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <span className="bg-white text-gray-900 text-[13px] font-semibold px-5 py-2 rounded-full shadow-md">
            {tool.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
