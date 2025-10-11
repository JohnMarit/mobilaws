import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import './ResponseEditor.css';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponseEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  onReset?: () => void;
  isOpen: boolean;
}

export default function ResponseEditor({ 
  initialContent, 
  onSave, 
  onCancel, 
  onReset,
  isOpen 
}: ResponseEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 border border-gray-200 rounded-lg',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      // Convert plain text to HTML with proper paragraph tags if it's not already HTML
      const content = initialContent.includes('<') ? initialContent : `<p>${initialContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      editor.commands.setContent(content);
    }
  }, [editor, initialContent]);

  const handleSave = () => {
    if (editor) {
      const htmlContent = editor.getHTML();
      onSave(htmlContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(initialContent);
    }
    setIsEditing(false);
    onCancel();
  };

  const handleReset = () => {
    if (editor) {
      editor.commands.setContent(initialContent);
    }
    if (onReset) {
      onReset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Response</h3>
          <div className="flex items-center gap-2">
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                Reset to Original
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
            >
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Use the toolbar above to format your response. Changes will be applied when you copy or export.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
