'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Toolbar button helper
// ---------------------------------------------------------------------------

interface ToolbarBtnProps {
  icon: React.ElementType;
  title: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarBtn({ icon: Icon, title, isActive, onClick, disabled }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inner editor (loaded dynamically to avoid SSR issues with Tiptap)
// ---------------------------------------------------------------------------

function InnerEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // These imports will only run client-side thanks to dynamic()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEditor, EditorContent } = require('@tiptap/react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StarterKit = require('@tiptap/starter-kit').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LinkExtension = require('@tiptap/extension-link').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageExtension = require('@tiptap/extension-image').default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Placeholder = require('@tiptap/extension-placeholder').default;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary-700 underline' },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Nhap noi dung...',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }: { editor: { getHTML: () => string } }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-4 py-3 min-h-[180px] font-body text-neutral-700 focus:outline-none',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL hinh anh');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <ToolbarBtn
          icon={Bold}
          title="In dam"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarBtn
          icon={Italic}
          title="In nghieng"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarBtn
          icon={Strikethrough}
          title="Gach ngang"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />

        <span className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarBtn
          icon={Heading2}
          title="Tieu de 2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarBtn
          icon={Heading3}
          title="Tieu de 3"
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        <span className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarBtn
          icon={List}
          title="Danh sach"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarBtn
          icon={ListOrdered}
          title="Danh sach so"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <span className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarBtn
          icon={LinkIcon}
          title="Lien ket"
          isActive={editor.isActive('link')}
          onClick={setLink}
        />
        <ToolbarBtn
          icon={ImageIcon}
          title="Hinh anh"
          onClick={addImage}
        />

        <span className="mx-1 h-5 w-px bg-neutral-200" />

        <ToolbarBtn
          icon={Undo2}
          title="Hoan tac"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarBtn
          icon={Redo2}
          title="Lam lai"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamically imported wrapper (ssr: false)
// ---------------------------------------------------------------------------

const DynamicInnerEditor = dynamic(() => Promise.resolve(InnerEditor), {
  ssr: false,
  loading: () => <EditorFallback />,
});

// ---------------------------------------------------------------------------
// Textarea fallback shown while the editor JS loads
// ---------------------------------------------------------------------------

function EditorFallback() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-7 w-7 rounded-lg bg-neutral-200 animate-pulse" />
        ))}
      </div>
      <textarea
        disabled
        placeholder="Dang tai trinh soan thao..."
        className="w-full min-h-[180px] resize-none px-4 py-3 text-sm font-body text-neutral-400 focus:outline-none bg-white"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

export default function RichTextEditor(props: RichTextEditorProps) {
  // Ensure we only render on the client – useState guarantees a re-render
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <EditorFallback />;

  return (
    <div className={props.className}>
      <DynamicInnerEditor {...props} />
    </div>
  );
}
