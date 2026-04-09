/**
 * CommonMark 把同一段落里的单换行当成空格，论文里的 Algorithm / 伪代码会连成一整段。
 * 对「含多行 `数字: ` 步骤」的块在行间插入 GFM 硬换行（行尾两空格），渲染为 <br />，并保留行内公式给 KaTeX。
 */
export function wrapPseudocodeMarkdownBlocks(md: string): string {
  const text = md.replace(/\r\n/g, '\n');
  const parts = text.split(/\n\n+/);
  const out: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (/<table[\s>]|<div\s/i.test(p)) {
      out.push(p);
      continue;
    }

    const lines = p.split('\n');
    const digitLines = lines.filter((l) => /^\d+:\s/.test(l.trim()));

    if (lines.length >= 2 && digitLines.length >= 2) {
      out.push(lines.join('  \n'));
      continue;
    }

    if (lines.length === 1 && /^Algorithm\s+\d+/i.test(p.trim()) && i + 1 < parts.length) {
      const next = parts[i + 1];
      if (/<table[\s>]|<div\s/i.test(next)) {
        out.push(p);
        continue;
      }
      const nextLines = next.split('\n');
      const nextDigit = nextLines.filter((l) => /^\d+:\s/.test(l.trim()));
      if (nextLines.length >= 2 && nextDigit.length >= 2) {
        out.push([p.trim(), ...nextLines].join('  \n'));
        i++;
        continue;
      }
    }

    out.push(p);
  }

  return out.join('\n\n');
}
