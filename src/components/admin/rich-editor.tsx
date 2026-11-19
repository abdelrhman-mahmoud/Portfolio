"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useId, useState } from "react";
export function RichEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [link, setLink] = useState("");
  const id = useId();
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
        class: "rich-text editor-content",
      },
    },
  });
  if (!editor) return <div className="editor-loading">Loading editor…</div>;
  const actions = [
    {
      name: "Bold",
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      name: "Italic",
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      name: "Heading",
      active: editor.isActive("heading"),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      name: "Bullets",
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      name: "Numbered list",
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      name: "Quote",
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    { name: "Undo", run: () => editor.chain().focus().undo().run() },
  ];
  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        {actions.map((action) => (
          <button
            key={action.name}
            type="button"
            aria-pressed={action.active}
            onClick={action.run}
          >
            {action.name}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <div className="editor-link">
        <label htmlFor={id} className="sr-only">
          Link URL
        </label>
        <input
          id={id}
          type="url"
          placeholder="https://… (select text, then add link)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            if (/^https?:\/\//.test(link)) {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: link })
                .run();
              setLink("");
            }
          }}
        >
          Add link
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          Unlink
        </button>
      </div>
    </div>
  );
}
