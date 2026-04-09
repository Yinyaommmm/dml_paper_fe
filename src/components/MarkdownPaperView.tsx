import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ImgHTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { getMarkdown } from '../api';
import { getToken } from '../auth';
import { wrapPseudocodeMarkdownBlocks } from '../lib/wrapPseudocodeMarkdown';
import 'katex/dist/katex.min.css';

interface MarkdownPaperViewProps {
  fileId: string;
  filename?: string;
}

function buildImageFetchUrl(src: string, fileId: string): string | null {
  const t = src.trim();
  if (t.startsWith('/api/files/')) {
    return t;
  }
  if (t.startsWith('/files/')) {
    return `/api${t}`;
  }
  const rel = t.replace(/^\//, '');
  if (!rel) return null;
  const encodedPath = rel.split('/').map(encodeURIComponent).join('/');
  return `/api/files/${fileId}/markdown-assets/${encodedPath}`;
}

/**
 * 用 fetch+Blob 为需要鉴权的图片赋 src。
 *
 * KaTeX / rehype-raw / React 重渲染会**替换** DOM 里的 <img>，新节点又回到 /api/...（无 Authorization 会 裂图）。
 * 仅跑一次 useEffect 不够，因此用 MutationObserver 在子树变化时重新注入 blob，并对同一 fetch URL 做缓存避免泄漏与重复请求。
 */
function useAuthorizedImages(containerRef: React.RefObject<HTMLDivElement | null>, fileId: string | null, markdownVersion: string) {
  useLayoutEffect(() => {
    if (!fileId || !markdownVersion) return;

    let cancelled = false;
    /** fetchUrl（规范化后）→ blob: URL，仅在本次 effect 生命周期内有效 */
    const cache = new Map<string, string>();

    const authHeaders = (): Record<string, string> => {
      const t = getToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    };

    let mo: MutationObserver | null = null;
    let rafScheduled = false;

    const hydrate = async () => {
      if (cancelled) return;
      const root = containerRef.current;
      if (!root) return;

      const imgs = root.querySelectorAll('img');
      for (const img of imgs) {
        if (cancelled) break;
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:') || /^https?:\/\//i.test(src)) continue;
        if (src.startsWith('blob:')) continue;

        const fetchUrl = buildImageFetchUrl(src, fileId);
        if (!fetchUrl) continue;

        const cached = cache.get(fetchUrl);
        if (cached) {
          if (img.src !== cached) img.src = cached;
          continue;
        }

        try {
          const res = await fetch(fetchUrl, { headers: authHeaders() });
          if (!res.ok || cancelled) continue;
          const blob = await res.blob();
          if (cancelled) continue;
          const url = URL.createObjectURL(blob);
          cache.set(fetchUrl, url);
          img.src = url;
          img.removeAttribute('srcset');
        } catch {
          /* ignore */
        }
      }
    };

    const scheduleHydrate = () => {
      if (cancelled || rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        void hydrate();
      });
    };

    const bind = (root: HTMLDivElement) => {
      mo = new MutationObserver(scheduleHydrate);
      mo.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
      });
      scheduleHydrate();
    };

    let raf0 = 0;
    let raf1 = 0;
    const rootNow = containerRef.current;
    if (rootNow) {
      bind(rootNow);
    } else {
      raf0 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => {
          const r = containerRef.current;
          if (r && !cancelled) bind(r);
        });
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
      mo?.disconnect();
      cache.forEach((u) => URL.revokeObjectURL(u));
      cache.clear();
    };
  }, [fileId, markdownVersion]);
}

export function MarkdownPaperView({ fileId, filename }: MarkdownPaperViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMarkdown(null);
    setReady(false);

    getMarkdown(fileId)
      .then((data) => {
        if (cancelled) return;
        setReady(data.ready);
        if (!data.ready || data.markdown == null) {
          setMarkdown(null);
          setError(null);
          return;
        }
        setMarkdown(data.markdown);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '加载失败');
        setMarkdown(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  /** 全文作为版本号：内容不变则依赖不变；避免仅用 slice(64) 时与 MutationObserver 重复触发冲突 */
  const markdownVersion = markdown ?? '';
  const markdownForRender = useMemo(
    () => (markdown != null ? wrapPseudocodeMarkdownBlocks(markdown) : null),
    [markdown],
  );
  useAuthorizedImages(containerRef, fileId, markdownVersion);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white border-l border-default">
      <div className="shrink-0 px-5 py-3 border-b border-default bg-white flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{filename ?? '未命名'}</p>
          <p className="text-xs text-muted truncate">Markdown 预览（与 OCR 结果一致）</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin bg-gray-50">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted text-sm py-16">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>正在加载 Markdown…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center gap-2 text-red-600 text-sm py-16 px-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && !ready && (
          <div className="flex flex-col items-center justify-center text-center text-muted text-sm py-16 px-8">
            <p className="mb-2">该 PDF 的 Markdown 尚未生成。</p>
            <p className="text-xs text-gray-400">请等待左侧任务处理完成（OCR 结束后会自动写出 .md）。</p>
          </div>
        )}

        {!loading && !error && ready && markdown != null && (
          <div ref={containerRef} className="md-paper max-w-4xl mx-auto px-6 py-8 pb-16">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                h1: (props) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 scroll-mt-20" {...props} />,
                h2: (props) => <h2 className="text-xl font-bold text-gray-900 mt-7 mb-3 scroll-mt-20" {...props} />,
                h3: (props) => <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2 scroll-mt-20" {...props} />,
                h4: (props) => <h4 className="text-base font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                p: (props) => <p className="text-[15px] leading-relaxed text-gray-800 my-3" {...props} />,
                ul: (props) => <ul className="list-disc pl-6 my-3 text-[15px] text-gray-800 space-y-1" {...props} />,
                ol: (props) => <ol className="list-decimal pl-6 my-3 text-[15px] text-gray-800 space-y-1" {...props} />,
                li: (props) => <li className="leading-relaxed" {...props} />,
                a: (props) => (
                  <a className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                blockquote: (props) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 my-4 text-gray-600 italic" {...props} />
                ),
                code: (props) => {
                  const { className, children, ...rest } = props;
                  const inline = !className;
                  return inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-gray-200/80 text-sm font-mono text-gray-900" {...rest}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
                pre: (props) => (
                  <pre className="overflow-x-auto rounded-lg bg-gray-900 text-gray-100 p-4 my-4 text-sm font-mono" {...props} />
                ),
                table: (props) => (
                  <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full border-collapse text-sm text-gray-800" {...props} />
                  </div>
                ),
                thead: (props) => <thead className="bg-gray-100" {...props} />,
                th: (props) => <th className="border border-gray-200 px-3 py-2 text-left font-semibold" {...props} />,
                td: (props) => <td className="border border-gray-200 px-3 py-2 align-top" {...props} />,
                hr: () => <hr className="my-8 border-gray-200" />,
                img: ({ node: _n, ...props }) => {
                  const {
                    src,
                    alt,
                    width,
                    height,
                    className: _c,
                    style,
                  } = props as ImgHTMLAttributes<HTMLImageElement>;
                  return (
                    <img
                      src={typeof src === 'string' ? src : undefined}
                      alt={typeof alt === 'string' ? alt : ''}
                      width={width}
                      height={height}
                      className="max-w-full h-auto rounded-md my-4 mx-auto block shadow-sm bg-white"
                      style={style}
                      loading="lazy"
                      decoding="async"
                    />
                  );
                },
              }}
            >
              {markdownForRender}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
