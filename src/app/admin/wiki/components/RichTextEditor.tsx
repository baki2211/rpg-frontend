'use client';

import React, { useRef } from 'react';

const RichTextToolbar: React.FC<{
  onFormat: (format: string, value?: string) => void;
}> = ({ onFormat }) => {
  return (
    <div className="rich-text-toolbar">
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('bold')} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => onFormat('italic')} title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" onClick={() => onFormat('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('h1')} title="Heading 1">
          H1
        </button>
        <button type="button" onClick={() => onFormat('h2')} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => onFormat('h3')} title="Heading 3">
          H3
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('ul')} title="Bullet List">
          • List
        </button>
        <button type="button" onClick={() => onFormat('ol')} title="Numbered List">
          1. List
        </button>
        <button type="button" onClick={() => onFormat('blockquote')} title="Quote">
          &quot;
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('code')} title="Inline Code">
          {'</>'}
        </button>
        <button type="button" onClick={() => onFormat('codeblock')} title="Code Block">
          {'```'}
        </button>
        <button type="button" onClick={() => onFormat('link')} title="Link">
          Link
        </button>
      </div>
    </div>
  );
};

export const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ value, onChange, placeholder = "Write your content here...", rows = 15 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (format: string, customValue?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'h1':
        replacement = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        replacement = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'h3':
        replacement = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'ul':
        replacement = selectedText
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : '- List item';
        break;
      case 'ol':
        replacement = selectedText
          ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. List item';
        break;
      case 'blockquote':
        replacement = selectedText
          ? selectedText.split('\n').map(line => `> ${line}`).join('\n')
          : '> Quote text';
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        replacement = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'link': {
        const url = customValue || prompt('Enter URL:') || 'https://example.com';
        replacement = `[${selectedText || 'link text'}](${url})`;
        break;
      }
      default:
        return;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
      }
    }
  };

  return (
    <div className="rich-text-editor">
      <RichTextToolbar onFormat={handleFormat} />
      <textarea
        ref={textareaRef}
        className="form-input content-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />
      <small>Supports Markdown formatting. Use the toolbar buttons or keyboard shortcuts.</small>
    </div>
  );
};
