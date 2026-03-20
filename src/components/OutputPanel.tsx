import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn, escapeHtml } from '../lib/utils';
import type { OcrResult, OcrBlock, PageData } from '../types';
import { verifyReferences, getReferences, getVerifyProgress, type ReferenceResult, type VerifyProgress } from '../api';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Helper component for table cell content with math
function TableCellContent({ content }: { content: React.ReactNode }) {
  if (typeof content !== 'string') return <>{content}</>;

  const parts = content.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { throwOnError: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

interface OutputPanelProps {
  ocrResult: OcrResult | null;
  fileId?: string | null;
  className?: string;
}

type OutputFormat = 'markdown' | 'text' | 'json' | 'reference';

export function OutputPanel({ ocrResult, fileId, className }: OutputPanelProps) {
  const [format, setFormat] = useState<OutputFormat>('markdown');
  const [referenceData, setReferenceData] = useState<{
    total: number;
    valid: number;
    invalid: number;
    results: ReferenceResult[];
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState<VerifyProgress | null>(null);

  useEffect(() => {
    setReferenceData(null);
    setIsVerifying(false);

    if (fileId) {
      getReferences(fileId).then((data) => {
        if (data && data.total > 0) {
          setReferenceData(data);
        }
      }).catch(() => {});
    }
  }, [fileId]);

  const handleVerify = async () => {
    if (!fileId) return;
    setIsVerifying(true);
    setVerifyProgress({ status: 'processing', progress: 0, current: 0, total: 0 });

    try {
      const result = await verifyReferences(fileId);
      if (result.success) {
        const pollInterval = setInterval(async () => {
          const progress = await getVerifyProgress(fileId);
          setVerifyProgress(progress);

          if (progress.status === 'completed' || progress.status === 'not_started') {
            clearInterval(pollInterval);
            const data = await getReferences(fileId);
            if (data) setReferenceData(data);
            setIsVerifying(false);
            setVerifyProgress(null);
          }
        }, 1000);
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsVerifying(false);
          setVerifyProgress(null);
        }, 120000);
      } else {
        setIsVerifying(false);
        setVerifyProgress(null);
      }
    } catch {
      setIsVerifying(false);
      setVerifyProgress(null);
    }
  };

  if (!ocrResult) {
    return (
      <div className={cn('flex-1 flex items-center justify-center text-muted', className)}>
        <div className="text-center">
          <p className="text-sm">No content yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden min-h-0', className)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-default flex-shrink-0">
        {(['markdown', 'text', 'json', 'reference'] as OutputFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
              format === f
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:text-foreground hover:bg-muted/50'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {format === 'markdown' && <MarkdownContent ocrResult={ocrResult} />}
        {format === 'text' && <TextContent ocrResult={ocrResult} />}
        {format === 'json' && <JsonContent ocrResult={ocrResult} />}
        {format === 'reference' && (
          <ReferenceContent
            fileId={fileId}
            referenceData={referenceData}
            isVerifying={isVerifying}
            verifyProgress={verifyProgress}
            onVerify={handleVerify}
          />
        )}
      </div>
    </div>
  );
}

// ─── Markdown Tab ────────────────────────────────────────────────────────────

function MarkdownContent({ ocrResult }: { ocrResult: OcrResult }) {
  const pages = ocrResult.pages || [];

  return (
    <div className="space-y-6 min-w-0">
      {pages.map((page) => (
        <PageSection key={page.page_num} page={page} />
      ))}
    </div>
  );
}

interface PageSectionProps {
  page: PageData;
}

function PageSection({ page }: PageSectionProps) {
  const blocks = page.blocks || [];

  const imageBlocks = blocks.filter((b) =>
    ['image', 'figure', 'chart', 'header_image'].includes(b.type || '')
  );
  const textBlocks = blocks.filter(
    (b) => !['image', 'figure', 'chart', 'header_image'].includes(b.type || '')
  );

  return (
    <div className="page-section">
      <div className="text-xs font-medium text-muted-foreground mb-3 pb-2 border-b border-default flex items-center justify-between">
        <span>Page {page.page_num}</span>
        <span className="text-muted">{blocks.length} blocks</span>
      </div>

      {imageBlocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {imageBlocks.map((block) => (
            <MarkdownImageBlock key={block.id} block={block} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {textBlocks.map((block) => (
          <TextBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function getBlockStyles(type: string | undefined): {
  containerClass: string;
  label: string;
  labelColor: string;
} {
  switch (type) {
    case 'doc_title':
      return {
        containerClass: 'bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary pl-4 py-3',
        label: 'Title',
        labelColor: 'bg-primary text-white',
      };
    case 'header':
      return {
        containerClass: 'bg-muted/30 border-l-2 border-muted-foreground/30 pl-3 py-2 text-sm',
        label: 'Header',
        labelColor: 'bg-gray-200 text-gray-600',
      };
    case 'paragraph_title':
    case 'section_title':
      return {
        containerClass: 'border-l-[3px] border-blue-400 pl-3 py-2 font-semibold',
        label: 'Section',
        labelColor: 'bg-blue-100 text-blue-700',
      };
    case 'abstract':
      return {
        containerClass: 'bg-blue-50/50 border-l-4 border-blue-400 pl-4 py-3 italic',
        label: 'Abstract',
        labelColor: 'bg-blue-100 text-blue-700',
      };
    case 'reference':
    case 'reference_content':
      return {
        containerClass: 'bg-amber-50/30 border-l-2 border-amber-300 pl-3 py-1 text-sm',
        label: 'Ref',
        labelColor: 'bg-amber-100 text-amber-700',
      };
    case 'caption':
    case 'figure_caption':
    case 'table_caption':
      return {
        containerClass: 'bg-muted/20 border-l-2 border-muted pl-3 py-1 text-sm italic text-muted',
        label: 'Caption',
        labelColor: 'bg-gray-100 text-gray-500',
      };
    case 'table':
      return {
        containerClass: 'bg-white border border-default rounded overflow-hidden',
        label: 'Table',
        labelColor: 'bg-emerald-100 text-emerald-700',
      };
    case 'text':
    case 'paragraph':
    default:
      return {
        containerClass: 'py-2 px-1',
        label: 'Text',
        labelColor: 'bg-gray-100 text-gray-600',
      };
  }
}

function TextBlock({ block }: { block: OcrBlock }) {
  const styles = getBlockStyles(block.type);

  let processedText = (block.text || '')
    .replace(/src="\/api\/images\//g, 'src="/api/images/');

  const tagConversions: [RegExp, string][] = [
    [/<url\b[^>]*>/gi, '<span class="text-blue-600 break-all">'],
    [/<\/url>/gi, '</span>'],
    [/<transportation\b[^>]*>/gi, '<span class="italic">'],
    [/<\/transportation>/gi, '</span>'],
    [/<goal\b[^>]*>/gi, '<span class="font-semibold">'],
    [/<\/goal>/gi, '</span>'],
    [/<start\b[^>]*>/gi, '<span class="text-green-600 font-semibold">'],
    [/<\/start>/gi, '</span>'],
  ];

  for (const [pattern, replacement] of tagConversions) {
    processedText = processedText.replace(pattern, replacement);
  }

  return (
    <div
      className={cn('block-item rounded-r-lg group', styles.containerClass)}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide', styles.labelColor)}>
          {styles.label}
        </span>
        <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          {block.bbox ? `${Math.round(block.bbox.width)}×${Math.round(block.bbox.height)}` : ''}
        </span>
      </div>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            a: ({ href, children, ...props }) => (
              <a href={href} className="text-blue-600 break-all" {...props}>{children}</a>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="max-w-full rounded border border-default my-2"
                loading="lazy"
              />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-default text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr className="border-b border-default">{children}</tr>,
            th: ({ children, style, ...rest }) => (
              <th
                className="px-2 py-1.5 text-sm font-semibold border border-default bg-muted align-middle"
                style={style}
                {...rest}
              >
                <TableCellContent content={children} />
              </th>
            ),
            td: ({ children, style, ...rest }) => (
              <td
                className="px-2 py-1.5 text-sm border border-default align-middle"
                style={style}
                {...rest}
              >
                <TableCellContent content={children} />
              </td>
            ),
          }}
        >
          {processedText}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function MarkdownImageBlock({ block }: { block: OcrBlock }) {
  const imageUrl = block.image_url?.startsWith('http')
    ? block.image_url
    : (block.image_url ?? '');

  return (
    <div
      className="p-3 rounded-lg border-2 border-transparent bg-muted"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="text-xs text-muted mb-2 flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-primary/10 rounded capitalize font-medium">
          {block.type}
        </span>
        <span>Page {block.page}</span>
      </div>
      <img
        src={imageUrl}
        alt={block.text || 'Extracted image'}
        className="max-w-full rounded border border-default"
        loading="lazy"
      />
      {block.text && (
        <div className="text-sm text-muted mt-2 italic">{escapeHtml(block.text)}</div>
      )}
    </div>
  );
}

// ─── Text Tab ────────────────────────────────────────────────────────────────

function TextContent({ ocrResult }: { ocrResult: OcrResult }) {
  const blocks = useMemo(() => {
    const all: OcrBlock[] = [];
    ocrResult.pages?.forEach((page) => {
      page.blocks?.forEach((block) => all.push(block));
    });
    return all;
  }, [ocrResult]);

  return (
    <div className="space-y-3 min-w-0">
      {blocks.map((block) => {
        const isImageBlock = ['image', 'figure', 'chart', 'table', 'header_image'].includes(block.type || '');
        const hasImage = !!block.image_url;

        if (isImageBlock && hasImage) {
          return <ImageBlock key={block.id} block={block} />;
        }

        return <TextSegment key={block.id} block={block} />;
      })}
    </div>
  );
}

function ImageBlock({ block }: { block: OcrBlock }) {
  const imageUrl = block.image_url?.startsWith('http')
    ? block.image_url
    : (block.image_url ?? '');

  return (
    <div
      className="p-3 rounded-lg border-2 border-transparent bg-muted"
      data-block-id={block.id}
    >
      <div className="text-xs text-muted mb-2 flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-primary/10 rounded">{block.type}</span>
        <span>Page {block.page}</span>
      </div>
      <img
        src={imageUrl}
        alt={block.text || 'Extracted image'}
        className="max-w-full rounded border border-default"
        loading="lazy"
      />
      {block.text && (
        <div className="text-sm text-muted mt-2 italic">{escapeHtml(block.text)}</div>
      )}
    </div>
  );
}

function TextSegment({ block }: { block: OcrBlock }) {
  return (
    <div
      className="text-segment"
      data-block-id={block.id}
    >
      <div>{escapeHtml(block.text)}</div>
      <div className="segment-meta">
        Page {block.page} · Confidence: {((block.confidence || 0.95) * 100).toFixed(1)}%
      </div>
    </div>
  );
}

// ─── JSON Tab ────────────────────────────────────────────────────────────────

function JsonContent({ ocrResult }: { ocrResult: OcrResult }) {
  return (
    <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
      {JSON.stringify(ocrResult.json, null, 2)}
    </pre>
  );
}

// ─── Reference Tab ───────────────────────────────────────────────────────────

interface ReferenceContentProps {
  fileId: string | null | undefined;
  referenceData: {
    total: number;
    valid: number;
    invalid: number;
    results: ReferenceResult[];
  } | null;
  isVerifying: boolean;
  verifyProgress: VerifyProgress | null;
  onVerify: () => void;
}

function ReferenceContent({ fileId, referenceData, isVerifying, verifyProgress, onVerify }: ReferenceContentProps) {
  if (!fileId) {
    return (
      <div className="text-center text-muted py-8">
        <p>Select a file to verify references</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with verify button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Reference Verification</h3>
          {referenceData && (
            <div className="text-sm text-muted mt-1">
              {referenceData.total} references found ·{' '}
              <span className="text-green-600">{referenceData.valid} valid</span> ·{' '}
              <span className="text-red-600">{referenceData.invalid} invalid</span>
            </div>
          )}
          {verifyProgress && verifyProgress.status === 'processing' && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Verifying: {verifyProgress.current}/{verifyProgress.total} ({verifyProgress.progress}%)
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${verifyProgress.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            'Verify References'
          )}
        </button>
      </div>

      {/* Results list */}
      {referenceData && referenceData.results.length > 0 ? (
        <div className="space-y-3">
          {referenceData.results.map((ref) => (
            <div
              key={ref.ref_num}
              className={cn(
                'p-4 rounded-lg border',
                ref.status === 'valid' || ref.status === 'second'
                  ? 'bg-green-50 border-green-200'
                  : ref.status === 'invalid'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {ref.status === 'valid' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : ref.status === 'second' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">[{ref.ref_num}]</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        ref.status === 'valid'
                          ? 'bg-green-100 text-green-700'
                          : ref.status === 'second'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {ref.status === 'valid'
                        ? 'Verified'
                        : ref.status === 'second'
                        ? 'Partial Match'
                        : ref.status}
                    </span>
                    {ref.relevance_score !== null && (
                      <span className="text-xs text-muted">
                        Score: {((ref.relevance_score ?? 0) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted mb-2">{ref.message}</p>

                  <div className="text-sm mb-2">
                    <span className="text-muted">Original: </span>
                    {ref.original_text.length > 150
                      ? ref.original_text.slice(0, 150) + '...'
                      : ref.original_text}
                  </div>

                  {ref.extracted_title && (
                    <div className="text-sm mb-2">
                      <span className="text-muted">Matched: </span>
                      <span className="italic">{ref.extracted_title}</span>
                    </div>
                  )}

                  {ref.doi && (
                    <div className="text-sm">
                      <span className="text-muted">DOI: </span>
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {ref.doi}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : referenceData && referenceData.total === 0 ? (
        <div className="text-center text-muted py-8">
          <p>No references found in this document</p>
        </div>
      ) : (
        <div className="text-center text-muted py-8">
          <p>Click "Verify References" to check references against OpenAlex</p>
        </div>
      )}
    </div>
  );
}
