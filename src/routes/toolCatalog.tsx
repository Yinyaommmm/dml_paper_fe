import type { ReactNode } from 'react';

export interface ToolDefinition {
  id: string;
  /** URL path (e.g. /reference-checking) */
  path: string;
  name: string;
  description: string;
  icon: ReactNode;
  available: boolean;
  gradient: string;
}

export const REFERENCE_CHECKING_PATH = '/reference-checking';
export const PAPER_TO_MARKDOWN_PATH = '/paper-to-markdown';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'reference-checking',
    path: REFERENCE_CHECKING_PATH,
    name: 'Reference Checking',
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
    id: 'paper-to-markdown',
    path: PAPER_TO_MARKDOWN_PATH,
    name: 'Paper To Markdown',
    description: '将 PDF 转为结构化 Markdown，支持公式与插图预览',
    available: true,
    gradient: 'from-slate-600 to-slate-800',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="8" y="6" width="32" height="38" rx="3" fill="white" fillOpacity=".12" stroke="white" strokeWidth="1.5"/>
        <path d="M14 14h20M14 20h14M14 26h18M14 32h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M30 36l6-4v8l-6-4z" fill="white" fillOpacity=".25" stroke="white" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'layout-analysis',
    path: '/layout-analysis',
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
    path: '/formula-extractor',
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
    path: '/citation-graph',
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
    path: '/abstract-summary',
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
    path: '/plagiarism-check',
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
    path: '/keyword-extractor',
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
    path: '/table-extractor',
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
    path: '/figure-extractor',
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
