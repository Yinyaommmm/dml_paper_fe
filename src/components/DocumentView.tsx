import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, HelpCircle, FileSearch, ZoomIn, ZoomOut, RotateCcw, ShieldCheck } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '../lib/utils';
import { getToken } from '../auth';
import {
  getPdfUrl,
  getReferences,
  verifyReferences,
  getVerifyProgress,
  humanVerifyReference,
  type ReferenceResult,
  type VerifyProgress,
} from '../api';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ─── PdfCanvasViewer ─────────────────────────────────────────────────────────

const SCALE_STEP = 0.25;
const SCALE_MIN  = 0.5;
const SCALE_MAX  = 3.0;
const SCALE_DEFAULT = 1.5;

interface PdfCanvasViewerProps {
  url: string;
  scale: number;
}

function PdfCanvasViewer({ url, scale }: PdfCanvasViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderingRef = useRef(false);

  const renderAllPages = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy, renderScale: number) => {
    if (renderingRef.current) return;
    renderingRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    // Use devicePixelRatio for crisp rendering on HiDPI screens
    const dpr = window.devicePixelRatio || 1;
    const physicalScale = renderScale * dpr;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: physicalScale });
      const cssWidth  = viewport.width  / dpr;
      const cssHeight = viewport.height / dpr;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-bottom: 12px; display: flex; justify-content: center; min-width: max-content;';

      const canvas = document.createElement('canvas');
      // Physical pixel dimensions for sharp rendering
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      // CSS dimensions keep the page at the logical scale
      canvas.style.cssText = `display: block; width: ${cssWidth}px; height: ${cssHeight}px; box-shadow: 0 1px 6px rgba(0,0,0,0.18); border-radius: 2px;`;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    }
    renderingRef.current = false;
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNumPages(0);

    pdfDocRef.current?.destroy();
    pdfDocRef.current = null;

    const token = getToken();
    const loadParams = {
      url,
      ...(token ? { httpHeaders: { Authorization: `Bearer ${token}` } } : {}),
    } satisfies Parameters<typeof pdfjsLib.getDocument>[0];
    pdfjsLib.getDocument(loadParams).promise.then((pdf) => {
      if (cancelled) { pdf.destroy(); return; }
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setLoading(false);
      renderAllPages(pdf, scale);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setLoading(false);
      setError(err instanceof Error ? err.message : 'PDF 加载失败');
    });

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy();
      pdfDocRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Re-render when scale changes (pdf already loaded)
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderingRef.current = false;
      renderAllPages(pdfDocRef.current, scale);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gray-100">
      {loading && (
        <div className="flex items-center justify-center h-full gap-2 text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在加载 PDF...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full gap-2 text-red-500 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {/* inner wrapper expands to fit page width so horizontal scroll works */}
      <div className="inline-block min-w-full p-4">
        {!loading && !error && numPages > 0 && (
          <p className="text-center text-xs text-muted mb-3">共 {numPages} 页</p>
        )}
        <div ref={containerRef} />
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

type RefStatus = 'valid' | 'second' | 'invalid' | 'error' | 'pending' | 'human_verified';

const STATUS_CONFIG: Record<RefStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  valid:          { label: '高置信度', bg: 'bg-green-100',   text: 'text-green-700',   icon: <CheckCircle2 className="w-4 h-4 text-green-500"  /> },
  second:         { label: '高置信度', bg: 'bg-green-100',   text: 'text-green-700',   icon: <CheckCircle2 className="w-4 h-4 text-green-500"  /> },
  human_verified: { label: '高置信度', bg: 'bg-green-100',   text: 'text-green-700',   icon: <CheckCircle2 className="w-4 h-4 text-green-500"  /> },
  invalid:        { label: '存在风险', bg: 'bg-red-100',     text: 'text-red-700',     icon: <XCircle      className="w-4 h-4 text-red-500"    /> },
  error:          { label: '验证失败', bg: 'bg-yellow-100',  text: 'text-yellow-700',  icon: <HelpCircle   className="w-4 h-4 text-yellow-500" /> },
  pending:        { label: '待验证',   bg: 'bg-gray-100',    text: 'text-gray-500',    icon: <Clock        className="w-4 h-4 text-gray-400"   /> },
};

// ─── References Tab ───────────────────────────────────────────────────────────

type FilterKey = Exclude<RefStatus, 'second'> | 'all' | 'no-doi';

function ReferencesTab({ fileId }: { fileId: string }) {
  const [refs, setRefs] = useState<ReferenceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState<VerifyProgress | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load on mount / fileId change
  useEffect(() => {
    setLoading(true);
    setFilter('all');
    getReferences(fileId)
      .then((data) => setRefs(data.results ?? []))
      .catch(() => setRefs([]))
      .finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fileId]);

  const handleVerify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setVerifyProgress({ status: 'processing', progress: 0, current: 0, total: 0 });

    try {
      const res = await verifyReferences(fileId);
      if (!res.success) { setIsVerifying(false); setVerifyProgress(null); return; }

      pollRef.current = setInterval(async () => {
        const p = await getVerifyProgress(fileId);
        setVerifyProgress(p);
        if (p.status === 'completed' || p.status === 'not_started') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          const data = await getReferences(fileId);
          setRefs(data.results ?? []);
          setIsVerifying(false);
          setVerifyProgress(null);
        }
      }, 1000);

      // Safety timeout
      setTimeout(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setIsVerifying(false);
        setVerifyProgress(null);
      }, 120_000);
    } catch {
      setIsVerifying(false);
      setVerifyProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">加载中...</span>
      </div>
    );
  }

  // Stats  (second + human_verified merged into valid)
  const isHighConf = (s: string) => s === 'valid' || s === 'second' || s === 'human_verified';
  const stats = {
    total:   refs.length,
    valid:   refs.filter(r => isHighConf(r.status)).length,
    invalid: refs.filter(r => r.status === 'invalid').length,
    error:   refs.filter(r => r.status === 'error').length,
    pending: refs.filter(r => r.status === 'pending').length,
    noDoi:   refs.filter(r => !r.doi?.trim() && !isHighConf(r.status)).length,
  };

  const filtered = filter === 'all'    ? refs
    : filter === 'no-doi'              ? refs.filter(r => !r.doi?.trim() && !isHighConf(r.status))
    : filter === 'valid'               ? refs.filter(r => isHighConf(r.status))
    : refs.filter(r => r.status === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row: title + verify button */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-semibold text-sm text-foreground">引用文献验证</h3>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying
            ? <><Loader2 className="w-3 h-3 animate-spin" />验证中...</>
            : '重新验证'}
        </button>
      </div>

      {/* Verify progress bar */}
      {verifyProgress?.status === 'processing' && (
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            正在验证 {verifyProgress.current}/{verifyProgress.total}（{verifyProgress.progress}%）
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${verifyProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {refs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted gap-2">
          <FileSearch className="w-10 h-10 opacity-30" />
          <p className="text-sm">未提取到引用，点击"重新验证"后可获取</p>
        </div>
      ) : (
        <>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}
              bg="bg-primary/10" activeBg="bg-primary" text="text-primary" activeText="text-white">
              共 {stats.total} 条
            </FilterPill>
            <FilterPill active={filter === 'valid'} onClick={() => setFilter('valid')}
              bg="bg-green-100" activeBg="bg-green-600" text="text-green-700" activeText="text-white">
              高置信度 {stats.valid}
            </FilterPill>
            <FilterPill active={filter === 'invalid'} onClick={() => setFilter('invalid')}
              bg="bg-red-100" activeBg="bg-red-600" text="text-red-700" activeText="text-white">
              存在风险 {stats.invalid}
            </FilterPill>
            {stats.error > 0 && (
              <FilterPill active={filter === 'error'} onClick={() => setFilter('error')}
                bg="bg-yellow-100" activeBg="bg-yellow-600" text="text-yellow-700" activeText="text-white">
                验证失败 {stats.error}
              </FilterPill>
            )}
            {stats.pending > 0 && (
              <FilterPill active={filter === 'pending'} onClick={() => setFilter('pending')}
                bg="bg-gray-100" activeBg="bg-gray-600" text="text-gray-500" activeText="text-white">
                待验证 {stats.pending}
              </FilterPill>
            )}
            {stats.noDoi > 0 && (
              <FilterPill active={filter === 'no-doi'} onClick={() => setFilter('no-doi')}
                bg="bg-orange-100" activeBg="bg-orange-600" text="text-orange-700" activeText="text-white">
                无 DOI {stats.noDoi}
              </FilterPill>
            )}
          </div>

          {/* Warning for invalid filter */}
          {filter === 'invalid' && stats.invalid > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-700 space-y-1">
                  <p className="font-semibold text-yellow-800">常见搜不到原因</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>文献太老，或标题发生改变（介词变化如 for ↔ from）</li>
                    <li>行末的 "-" 导致断词判断困难，影响搜索</li>
                    <li>文章名过短，无法匹配；或存在小概率识别错误</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Reference list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
            {filtered.map((ref) => (
              <ReferenceCard
                key={ref.ref_num}
                ref_={ref}
                onHumanVerify={async () => {
                  await humanVerifyReference(fileId, ref.ref_num);
                  // optimistic local update
                  setRefs(prev => prev.map(r =>
                    r.ref_num === ref.ref_num
                      ? { ...r, status: 'human_verified', verification_status: 'human_verified' }
                      : r
                  ));
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-24 text-muted text-sm">
                该分类下无引用
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  active, onClick, bg, activeBg, text, activeText, children,
}: {
  active: boolean; onClick: () => void;
  bg: string; activeBg: string; text: string; activeText: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium transition-all',
        active ? `${activeBg} ${activeText} shadow-sm` : `${bg} ${text} hover:opacity-80`
      )}
    >
      {children}
    </button>
  );
}

function ReferenceCard({
  ref_,
  onHumanVerify,
}: {
  ref_: ReferenceResult;
  onHumanVerify?: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  const status = (STATUS_CONFIG[ref_.status as RefStatus] ?? STATUS_CONFIG.pending);
  const isHumanVerified = ref_.status === 'human_verified' || ref_.verification_status === 'human_verified';

  // Close confirm popover on outside click
  useEffect(() => {
    if (!confirming) return;
    const handler = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [confirming]);

  const handleConfirm = async () => {
    if (!onHumanVerify) return;
    setVerifying(true);
    try { await onHumanVerify(); } finally { setVerifying(false); setConfirming(false); }
  };

  // Show the button for invalid refs OR valid/second with no DOI (not already human-verified)
  const showHumanVerifyBtn =
    !isHumanVerified &&
    (ref_.status === 'invalid' || (!ref_.doi?.trim() && (ref_.status === 'valid' || ref_.status === 'second')));

  return (
    <div className="relative flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Number badge */}
      <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-muted">
        {ref_.ref_num}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Extracted title section */}
        <div className="mb-2 pb-2 border-b border-gray-200">
          {ref_.extracted_title ? (
            <p className="text-sm font-medium text-blue-700 leading-relaxed">{ref_.extracted_title}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">未能成功提取标题</p>
          )}

          {/* DOI + cited_by_count + warning/info badges */}
          <div className="flex items-center flex-wrap gap-2 mt-1">
            {ref_.doi && (
              <a
                href={`https://doi.org/${ref_.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                DOI: {ref_.doi}
              </a>
            )}
            {ref_.cited_by_count !== null && ref_.cited_by_count !== undefined && (
              <span className="text-xs text-muted">引用量: {ref_.cited_by_count}</span>
            )}
            {isHumanVerified && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">
                <ShieldCheck className="w-3 h-3" />人工校验
              </span>
            )}
            {ref_.status === 'second' && !isHumanVerified && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">扩大搜索</span>
            )}
            {(ref_.status === 'valid' || ref_.status === 'second') && !isHumanVerified && (
              <>
                {!ref_.doi?.trim() && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-700">缺少 DOI</span>
                )}
                {ref_.cited_by_count !== null && ref_.cited_by_count !== undefined && ref_.cited_by_count < 10 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700">引用量较低</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Original text */}
        <p className="text-xs text-gray-700 leading-relaxed">{ref_.original_text}</p>

        {/* Verification message */}
        {ref_.message && (
          <p className="text-[10px] text-muted mt-1">{ref_.message}</p>
        )}
      </div>

      {/* Status badge + icon (top-right) */}
      <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
        {status.icon}
        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', status.bg, status.text)}>
          {status.label}
        </span>
      </div>

      {/* Human-verify button — absolute bottom-right of the card */}
      {showHumanVerifyBtn && (
        <div className="absolute bottom-2.5 right-3" ref={confirmRef}>
          <button
            onClick={() => setConfirming(v => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <ShieldCheck className="w-3 h-3" />
            已人工校验
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-purple-200 text-purple-700 text-[9px] font-bold leading-none">?</span>
          </button>

          {confirming && (
            <div className="absolute right-0 bottom-full mb-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 w-36">
              <p className="text-[11px] text-gray-700 mb-2 text-center">确认标记为已校验？</p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleConfirm}
                  disabled={verifying}
                  className="flex-1 py-1 rounded text-[11px] font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {verifying ? '...' : '确认'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-1 rounded text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DocumentView ─────────────────────────────────────────────────────────────

interface DocumentViewProps {
  fileId: string;
  filename?: string;
}

export function DocumentView({ fileId, filename }: DocumentViewProps) {
  const [scale, setScale] = useState(SCALE_DEFAULT);
  const pdfUrl = getPdfUrl(fileId);

  const zoomIn  = () => setScale(s => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
  const zoomReset = () => setScale(SCALE_DEFAULT);

  return (
    <div className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
      {/* ── Left: PDF preview ── */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-default overflow-hidden min-h-0">
        <div className="px-4 py-2.5 border-b border-default flex items-center justify-between flex-shrink-0 gap-2">
          <span className="font-medium text-sm truncate min-w-0">{filename ?? 'PDF 预览'}</span>
          {/* Zoom controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={zoomOut}
              disabled={scale <= SCALE_MIN}
              title="缩小"
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={zoomReset}
              title="重置缩放"
              className="px-1.5 py-0.5 rounded text-xs font-mono text-gray-600 hover:bg-gray-100 transition-colors min-w-[3rem] text-center"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= SCALE_MAX}
              title="放大"
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={zoomReset}
              title="重置缩放"
              className="p-1 rounded hover:bg-gray-100 transition-colors ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
        <PdfCanvasViewer key={fileId} url={pdfUrl} scale={scale} />
      </div>

      {/* ── Right: References ── */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-default overflow-hidden min-h-0">
        <div className="px-4 py-2.5 border-b border-default flex-shrink-0">
          <span className="font-medium text-sm">引用验证</span>
        </div>
        <div className="flex-1 overflow-hidden p-4 min-h-0 flex flex-col">
          <ReferencesTab fileId={fileId} />
        </div>
      </div>
    </div>
  );
}
