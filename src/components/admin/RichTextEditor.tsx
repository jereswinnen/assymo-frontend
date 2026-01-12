"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
  UnlinkIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "text-base max-w-none p-3 min-h-[150px] focus:outline-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="border rounded-md min-h-[140px] bg-muted/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}
      <div className="border rounded-md overflow-hidden">
        <div className="flex gap-1 p-2 border-b bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("heading", { level: 2 }) && "bg-muted",
            )}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("heading", { level: 3 }) && "bg-muted",
            )}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("heading", { level: 4 }) && "bg-muted",
            )}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
          >
            <Heading4Icon className="size-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("size-8 p-0", editor.isActive("bold") && "bg-muted")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("italic") && "bg-muted",
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="size-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("bulletList") && "bg-muted",
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "size-8 p-0",
              editor.isActive("orderedList") && "bg-muted",
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrderedIcon className="size-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("size-8 p-0", editor.isActive("link") && "bg-muted")}
            onClick={setLink}
          >
            <LinkIcon className="size-4" />
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              <UnlinkIcon className="size-4" />
            </Button>
          )}
        </div>
        <EditorContent editor={editor} />
      </div>
      {placeholder && !value && (
        <p className="text-xs text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}
