'use client';

import './placeholder.css';
import React from 'react';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Typography } from '@tiptap/extension-typography';
import { AnyExtension, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { cn } from '@ui/lib/utils';

export default function RichTextEditor({
  content,
  setContent,
  placeholder,
  className,
  parentClassName,
  characterLimit,
}: {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>> | ((content: string) => void);
  placeholder?: string;
  className?: string;
  parentClassName?: string;
  characterLimit?: number;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit as AnyExtension,
      Highlight,
      Typography,
      Link.configure({
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
      CharacterCount.configure({
        limit: characterLimit || undefined,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(`prose prose-sm dark:prose-invert focus:outline-none`, className),
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  return (
    <EditorContent
      editor={editor}
      className={cn('h-full w-full p-0 text-sm outline-none', parentClassName)}
    />
  );
}
