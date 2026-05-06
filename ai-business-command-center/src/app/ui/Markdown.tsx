// Tiny zero-dependency Markdown renderer just for output content.
// Handles: headers (## ###), bold (**), italic (*), inline code (`),
// hr (---), ordered lists, unordered lists, blockquotes, paragraphs.
// Good enough for displaying AI-generated marketing copy.

import { type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  // Order matters: bold first, then italic, then code.
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const patterns: { regex: RegExp; render: (match: RegExpExecArray) => ReactNode }[] = [
    { regex: /\*\*(.+?)\*\*/, render: (m) => <strong key={key++} className="text-white font-semibold">{m[1]}</strong> },
    { regex: /`(.+?)`/, render: (m) => <code key={key++} className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono text-[12.5px] text-violet-200">{m[1]}</code> },
    { regex: /\*(.+?)\*/, render: (m) => <em key={key++} className="italic text-white/70">{m[1]}</em> },
  ];

  while (remaining.length > 0) {
    let earliest: { index: number; len: number; node: ReactNode } | null = null;
    for (const p of patterns) {
      const m = p.regex.exec(remaining);
      if (m && (earliest === null || m.index < earliest.index)) {
        earliest = { index: m.index, len: m[0].length, node: p.render(m) };
      }
    }
    if (!earliest) {
      nodes.push(remaining);
      break;
    }
    if (earliest.index > 0) nodes.push(remaining.slice(0, earliest.index));
    nodes.push(earliest.node);
    remaining = remaining.slice(earliest.index + earliest.len);
  }
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === "") {
      i++;
      continue;
    }
    // hr
    if (trimmed === "---") {
      out.push(<hr key={key++} className="my-4 border-white/10" />);
      i++;
      continue;
    }
    // headers
    if (trimmed.startsWith("### ")) {
      out.push(<h3 key={key++} className="text-white font-semibold text-[15px] mt-4 mb-2">{inline(trimmed.slice(4))}</h3>);
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      out.push(<h2 key={key++} className="text-white font-bold text-[17px] mt-5 mb-2">{inline(trimmed.slice(3))}</h2>);
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      out.push(<h1 key={key++} className="text-white font-bold text-[19px] mt-5 mb-3">{inline(trimmed.slice(2))}</h1>);
      i++;
      continue;
    }
    // unordered list
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(
        <ul key={key++} className="list-disc list-outside ml-5 space-y-1 my-2 text-white/80 text-[13.5px] leading-relaxed marker:text-white/30">
          {items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}
        </ul>
      );
      continue;
    }
    // ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={key++} className="list-decimal list-outside ml-5 space-y-1 my-2 text-white/80 text-[13.5px] leading-relaxed marker:text-white/30">
          {items.map((it, idx) => <li key={idx}>{inline(it)}</li>)}
        </ol>
      );
      continue;
    }
    // blockquote
    if (trimmed.startsWith("> ")) {
      out.push(
        <blockquote key={key++} className="border-l-2 border-violet-400/40 pl-3 my-2 text-white/70 italic text-[13.5px]">
          {inline(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }
    // paragraph
    out.push(
      <p key={key++} className="text-white/80 text-[13.5px] leading-relaxed my-2">
        {inline(line)}
      </p>
    );
    i++;
  }

  return <div className="prose-mock">{out}</div>;
}
