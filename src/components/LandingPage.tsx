import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  gradient: string;
}

const TOOLS: Tool[] = [
  {
    id: 'paper-checking',
    name: 'Paper Checking',
    description: '自动解析 PDF 学术论文，提取并验证参考文献',
    available: true,
    gradient: 'from-blue-500 to-indigo-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="8" y="4" width="28" height="36" rx="3" fill="white" fillOpacity=".15" stroke="white" strokeWidth="1.5"/>
        <line x1="14" y1="13" x2="30" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="19" x2="30" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="25" x2="24" y2="25" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="34" cy="34" r="8" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1.5"/>
        <path d="M31 34l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'layout-analysis',
    name: 'Layout Analysis',
    description: '识别文档版面结构，提取图表、表格与段落区域',
    available: false,
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="6" y="6" width="16" height="16" rx="2" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1.5"/>
        <rect x="26" y="6" width="16" height="16" rx="2" fill="white" fillOpacity=".15" stroke="white" strokeWidth="1.5"/>
        <rect x="6" y="26" width="16" height="16" rx="2" fill="white" fillOpacity=".15" stroke="white" strokeWidth="1.5"/>
        <rect x="26" y="26" width="16" height="16" rx="2" fill="white" fillOpacity=".1" stroke="white" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'formula-extractor',
    name: 'Formula Extractor',
    description: '精准识别并提取论文中的数学公式为 LaTeX 格式',
    available: false,
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <text x="8" y="32" fill="white" fontSize="22" fontFamily="serif" fontStyle="italic">Σ</text>
        <text x="26" y="28" fill="white" fontSize="14" fontFamily="serif" fontStyle="italic">∫</text>
        <text x="30" y="38" fill="white" fontSize="12" fontFamily="serif">dx</text>
      </svg>
    ),
  },
  {
    id: 'citation-graph',
    name: 'Citation Graph',
    description: '可视化论文引用关系网络，发现关键影响文献',
    available: false,
    gradient: 'from-orange-500 to-rose-500',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="4" fill="white"/>
        <circle cx="10" cy="14" r="3" fill="white" fillOpacity=".7"/>
        <circle cx="38" cy="14" r="3" fill="white" fillOpacity=".7"/>
        <circle cx="10" cy="34" r="3" fill="white" fillOpacity=".5"/>
        <circle cx="38" cy="34" r="3" fill="white" fillOpacity=".5"/>
        <line x1="24" y1="24" x2="10" y2="14" stroke="white" strokeWidth="1.2" strokeOpacity=".6"/>
        <line x1="24" y1="24" x2="38" y2="14" stroke="white" strokeWidth="1.2" strokeOpacity=".6"/>
        <line x1="24" y1="24" x2="10" y2="34" stroke="white" strokeWidth="1.2" strokeOpacity=".6"/>
        <line x1="24" y1="24" x2="38" y2="34" stroke="white" strokeWidth="1.2" strokeOpacity=".6"/>
      </svg>
    ),
  },
  {
    id: 'abstract-summary',
    name: 'Abstract Summary',
    description: '一键生成论文摘要的中英文精简版本',
    available: false,
    gradient: 'from-sky-500 to-blue-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="8" y="8" width="32" height="8" rx="2" fill="white" fillOpacity=".25" stroke="white" strokeWidth="1.2"/>
        <line x1="8" y1="24" x2="40" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="30" x2="40" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="36" x2="28" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'plagiarism-check',
    name: 'Plagiarism Check',
    description: '比对多源数据库，智能检测文本相似度',
    available: false,
    gradient: 'from-red-500 to-pink-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="1.8"/>
        <line x1="27" y1="27" x2="40" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="20" x2="24" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="16" x2="20" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'keyword-extractor',
    name: 'Keyword Extractor',
    description: '自动识别论文核心关键词，生成词云与标签',
    available: false,
    gradient: 'from-amber-500 to-yellow-500',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <text x="4"  y="22" fill="white" fontSize="11" fontWeight="bold">AI</text>
        <text x="18" y="16" fill="white" fontSize="9"  fontWeight="bold" fillOpacity=".8">ML</text>
        <text x="6"  y="34" fill="white" fontSize="8"  fillOpacity=".7">NLP</text>
        <text x="22" y="30" fill="white" fontSize="13" fontWeight="bold">LLM</text>
        <text x="14" y="42" fill="white" fontSize="7"  fillOpacity=".6">OCR</text>
        <text x="32" y="42" fill="white" fontSize="7"  fillOpacity=".5">DNN</text>
      </svg>
    ),
  },
  {
    id: 'table-extractor',
    name: 'Table Extractor',
    description: '识别并导出论文中的结构化表格为 Excel/CSV',
    available: false,
    gradient: 'from-cyan-500 to-teal-500',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="6" y="8" width="36" height="32" rx="2" stroke="white" strokeWidth="1.5"/>
        <line x1="6"  y1="18" x2="42" y2="18" stroke="white" strokeWidth="1.2" strokeOpacity=".7"/>
        <line x1="6"  y1="28" x2="42" y2="28" stroke="white" strokeWidth="1.2" strokeOpacity=".7"/>
        <line x1="18" y1="8"  x2="18" y2="40" stroke="white" strokeWidth="1.2" strokeOpacity=".7"/>
        <line x1="30" y1="8"  x2="30" y2="40" stroke="white" strokeWidth="1.2" strokeOpacity=".7"/>
      </svg>
    ),
  },
  {
    id: 'figure-extractor',
    name: 'Figure Extractor',
    description: '高质量提取论文插图，支持图注自动关联',
    available: false,
    gradient: 'from-fuchsia-500 to-pink-600',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="6" y="10" width="36" height="28" rx="2" stroke="white" strokeWidth="1.5"/>
        <circle cx="16" cy="20" r="4" fill="white" fillOpacity=".3" stroke="white" strokeWidth="1.2"/>
        <path d="M6 32 l10-10 8 8 6-6 12 10" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
];

interface LandingPageProps {
  onEnterApp: () => void;
  onLogin: () => void;
  username?: string | null;
  onLogout?: () => void;
}

export function LandingPage({ onEnterApp, onLogin, username, onLogout }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col overflow-auto">
      {/* ── Navbar ── */}
      <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
            <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" fill="#4861ff"/>
            <path d="M24 14L12 20v12l12 6 12-6V20L24 14z" fill="#fff"/>
          </svg>
          <span className="text-lg font-semibold text-gray-900">DML Academic Tools</span>
        </button>

        {username ? (
          <div className="flex items-center gap-2">
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
            className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
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
            <ToolCard key={tool.id} tool={tool} onClick={tool.available ? onEnterApp : undefined} />
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

function ToolCard({ tool, onClick }: { tool: Tool; onClick?: () => void }) {
  const isClickable = !!onClick;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative rounded-2xl overflow-hidden border h-64 transition-all duration-300',
        isClickable
          ? 'cursor-pointer border-gray-200 hover:shadow-xl hover:-translate-y-0.5'
          : 'cursor-default border-gray-100 opacity-60',
      )}
    >
      {/* White base (text area) always underneath */}
      <div className="absolute inset-0 bg-white" />

      {/* Text content — fades out on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300"
        style={{ opacity: hovered ? 0 : 1 }}
      >
        <h3 className={cn('text-sm font-semibold mb-1', isClickable ? 'text-gray-900' : 'text-gray-400')}>
          {tool.name}
        </h3>
        <p className={cn('text-xs leading-relaxed', isClickable ? 'text-gray-500' : 'text-gray-400')}>
          {tool.description}
        </p>
      </div>

      {/* Gradient area — expands from top on hover */}
      <div
        className={cn('absolute top-0 left-0 right-0 bg-gradient-to-br transition-all duration-300 ease-in-out flex items-center justify-center', tool.gradient)}
        style={{
          height: hovered ? '100%' : '68%',
          borderRadius: hovered ? '0' : '0 0 1rem 1rem',
        }}
      >
        {/* Icon — shifts up, scales and rotates on hover */}
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

        {/* Badge */}
        <span className={cn(
          'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm',
          isClickable ? 'bg-white/30 text-white' : 'bg-black/20 text-white/80',
        )}>
          {isClickable ? '可用' : '即将上线'}
        </span>

        {/* Tool-name pill at bottom-center — slides up and fades in on hover */}
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
    </div>
  );
}
