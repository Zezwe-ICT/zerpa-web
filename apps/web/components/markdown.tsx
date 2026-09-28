/**
 * A small Markdown renderer for help articles: headings, paragraphs, lists, > tips, **bold**, `code` and links.
 * Builds React elements (no raw HTML), so article text can never inject markup. Copied from zerpa-internal.
 */
import { Fragment, type ReactNode } from "react";

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k} className="rounded bg-surface-2 px-1 py-0.5 text-[0.9em] font-mono">{tok.slice(1, -1)}</code>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!;
      const safe = /^(https?:\/\/|\/|mailto:)/.test(href) ? href : "#";
      out.push(<a key={k} href={safe} className="text-primary underline underline-offset-2" {...(safe.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1].length === 1 ? "text-lg" : h[1].length === 2 ? "text-base" : "text-sm";
      blocks.push(<p key={i} role="heading" aria-level={h[1].length + 1} className={`${size} font-semibold mt-5 mb-2 first:mt-0`}>{inline(h[2], i)}</p>);
      i++;
      continue;
    }
    const list = /^(\s*)([-*]|\d+\.)\s+/;
    if (list.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: ReactNode[] = [];
      while (i < lines.length && list.test(lines[i])) {
        items.push(<li key={i}>{inline(lines[i].replace(list, ""), i)}</li>);
        i++;
      }
      blocks.push(ordered
        ? <ol key={`l${i}`} className="list-decimal pl-5 space-y-1 my-3">{items}</ol>
        : <ul key={`l${i}`} className="list-disc pl-5 space-y-1 my-3">{items}</ul>);
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<div key={`q${i}`} className="my-3 rounded-[10px] border border-primary-ring bg-primary-tint px-4 py-3 text-sm">{inline(quote.join(" "), i)}</div>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={`p${i}`} className="my-3 leading-relaxed">{inline(para.join(" "), i)}</p>);
  }
  return <div className={className}>{blocks.map((b, k) => <Fragment key={k}>{b}</Fragment>)}</div>;
}
