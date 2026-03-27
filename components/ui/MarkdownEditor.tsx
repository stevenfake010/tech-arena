'use client';

import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, List, ListOrdered, Heading3, Minus } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accent?: 'secondary' | 'tertiary';
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  accent = 'secondary',
  rows = 5,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const borderColor = accent === 'tertiary' ? 'focus:border-tertiary' : 'focus:border-secondary';

  function wrapSelection(before: string, after: string, defaultText: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      const cursor = start + before.length + selected.length;
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function prefixLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
    // If line already starts with this prefix, remove it (toggle)
    if (value.slice(lineStart, lineStart + prefix.length) === prefix) {
      const next = value.slice(0, lineStart) + value.slice(lineStart + prefix.length);
      onChange(next);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(pos - prefix.length, pos - prefix.length);
      }, 0);
    } else {
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      onChange(next);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(pos + prefix.length, pos + prefix.length);
      }, 0);
    }
  }

  function insertHr() {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const hr = '\n---\n';
    const next = value.slice(0, pos) + hr + value.slice(pos);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + hr.length, pos + hr.length);
    }, 0);
  }

  const buttons = [
    { icon: Bold,        title: '加粗 (Ctrl+B)',   action: () => wrapSelection('**', '**', '加粗文字') },
    { icon: Italic,      title: '斜体 (Ctrl+I)',   action: () => wrapSelection('*', '*', '斜体文字') },
    { icon: Heading3,    title: '小标题',           action: () => prefixLine('### ') },
    { icon: List,        title: '无序列表',         action: () => prefixLine('- ') },
    { icon: ListOrdered, title: '有序列表',         action: () => prefixLine('1. ') },
    { icon: Minus,       title: '分割线',           action: insertHr },
  ];

  const minH = `${rows * 1.625}rem`;

  return (
    <div className={`border-b-2 border-outline ${accent === 'tertiary' ? 'focus-within:border-tertiary' : 'focus-within:border-secondary'} transition-colors`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1 pt-1 pb-0.5 bg-surface-container-low">
        {buttons.map(({ icon: Icon, title, action }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); action(); }}
            className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <Icon size={13} />
          </button>
        ))}
        <span className="ml-auto text-[11px] text-outline-variant/60 pr-1">Markdown</span>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-2 divide-x divide-outline/15 bg-surface-container-low">
        <div className="flex flex-col">
          <div className="px-3 pt-1.5 pb-0.5 text-[10px] text-outline-variant/50 uppercase tracking-widest select-none">编辑</div>
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-0 px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 placeholder:text-outline-variant/50"
            style={{ minHeight: minH }}
            placeholder={placeholder}
            rows={rows}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <div className="px-3 pt-1.5 pb-0.5 text-[10px] text-outline-variant/50 uppercase tracking-widest select-none">预览</div>
          <div
            className="px-3 py-2 overflow-y-auto text-sm"
            style={{ minHeight: minH }}
          >
            {value.trim() ? (
              <div className="markdown-content">
                <ReactMarkdown>{value}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-outline-variant/40 italic text-sm select-none">输入内容后在此预览...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
