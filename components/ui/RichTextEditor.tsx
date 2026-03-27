'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Minus, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  accent?: 'secondary' | 'tertiary';
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  accent = 'secondary',
  rows = 5,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'outline-none px-3 py-3 text-sm leading-relaxed',
        style: `min-height: ${rows * 1.75}rem`,
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
  });

  if (!editor) return null;

  const borderFocus = accent === 'tertiary'
    ? 'focus-within:border-tertiary'
    : 'focus-within:border-secondary';

  const tools = [
    { icon: Bold,        title: '加粗',     action: () => editor.chain().focus().toggleBold().run(),        active: () => editor.isActive('bold') },
    { icon: Italic,      title: '斜体',     action: () => editor.chain().focus().toggleItalic().run(),      active: () => editor.isActive('italic') },
    { icon: List,        title: '无序列表', action: () => editor.chain().focus().toggleBulletList().run(),  active: () => editor.isActive('bulletList') },
    { icon: ListOrdered, title: '有序列表', action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive('orderedList') },
    { icon: Minus,       title: '分割线',   action: () => editor.chain().focus().setHorizontalRule().run(), active: () => false },
  ];

  return (
    <div className={`border-b-2 border-outline ${borderFocus} transition-colors`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1 py-1 bg-surface-container-low border-b border-outline/15">
        {tools.map(({ icon: Icon, title, action, active }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); action(); }}
            className={`p-1.5 rounded transition-colors ${
              active()
                ? accent === 'tertiary'
                  ? 'bg-tertiary/15 text-tertiary'
                  : 'bg-secondary/15 text-secondary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Icon size={13} />
          </button>
        ))}
        <div className="w-px h-4 bg-outline/20 mx-1" />
        <button
          type="button"
          title="撤销"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().undo().run(); }}
          className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30"
          disabled={!editor.can().undo()}
        >
          <Undo size={13} />
        </button>
        <button
          type="button"
          title="重做"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().redo().run(); }}
          className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30"
          disabled={!editor.can().redo()}
        >
          <Redo size={13} />
        </button>
      </div>

      {/* Editor */}
      <div className="bg-surface-container-low">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
