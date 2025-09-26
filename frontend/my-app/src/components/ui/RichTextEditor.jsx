import { useState, useRef, useEffect } from 'react';
import {
  BoldIcon,
  ListBulletIcon,
  CheckIcon,
  PhotoIcon,
  PaintBrushIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const RichTextEditor = ({ content, onChange, placeholder, onCodeHistoryOpen }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [textAlign, setTextAlign] = useState('left');
  const [lineHeight, setLineHeight] = useState(1.5);
  const editorRef = useRef(null);

  const fonts = ['Inter', 'Monaco', 'Roboto', 'Arial', 'Times New Roman', 'Georgia', 'Courier New'];
  const colors = ['#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${fontSize}px`;
      editorRef.current.style.fontFamily = fontFamily;
      editorRef.current.style.textAlign = textAlign;
      editorRef.current.style.lineHeight = lineHeight;
      if (!content) {
        editorRef.current.innerHTML = `<div style="color: rgba(255,255,255,0.4);">${placeholder}</div>`;
      }
    }
  }, [fontSize, fontFamily, textAlign, lineHeight, content, placeholder]);

  const execCommand = (command, value = null) => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      let wrappedText = selectedText;
      switch (command) {
        case 'bold':
          wrappedText = `**${selectedText}**`;
          break;
        case 'italic':
          wrappedText = `*${selectedText}*`;
          break;
        case 'underline':
          wrappedText = `_${selectedText}_`;
          break;
        default:
          return;
      }
      
      const newValue = textarea.value.substring(0, start) + wrappedText + textarea.value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + wrappedText.length;
        textarea.focus();
      }, 0);
    }
  };

  const insertText = (text) => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const cleanText = text.replace(/<[^>]*>/g, '');
      
      const newValue = textarea.value.substring(0, start) + cleanText + textarea.value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + cleanText.length;
        textarea.focus();
      }, 0);
    }
  };

  const insertHeading = (level) => {
    const headingText = `\n${'#'.repeat(level)} Heading ${level}\n`;
    insertText(headingText);
  };

  const insertList = (type) => {
    const listTypes = {
      bullet: '\n• List item\n',
      number: '\n1. List item\n',
      todo: '\n☐ Todo item\n'
    };
    insertText(listTypes[type]);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
          const img = `<img src="${e.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.2);" alt="${file.name}" />`;
          editorRef.current.innerHTML += img;
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-white/20 p-3 bg-white/10 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-white/30 pr-2">
            <button onClick={() => execCommand('bold')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white" title="Bold">
              <BoldIcon className="w-4 h-4" />
            </button>
            <button onClick={() => execCommand('italic')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white font-italic" title="Italic">
              I
            </button>
            <button onClick={() => execCommand('underline')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white underline" title="Underline">
              U
            </button>
          </div>

          {/* Font Controls */}
          <div className="flex items-center gap-1 border-r border-white/30 pr-2">
            <div className="relative">
              <button 
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-all text-white"
              >
                {fontFamily}
              </button>
              {showFontPicker && (
                <div className="absolute top-8 left-0 bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/30 rounded-lg p-2 z-20 min-w-32">
                  {fonts.map(font => (
                    <button
                      key={font}
                      onClick={() => {
                        setFontFamily(font);
                        setShowFontPicker(false);
                      }}
                      className="block w-full text-left px-2 py-1 hover:bg-white/20 rounded text-sm text-white"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm text-white">-</button>
            <span className="px-2 text-sm text-white">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm text-white">+</button>
          </div>

          {/* Color Picker */}
          <div className="relative border-r border-white/30 pr-2">
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
              title="Text Color"
            >
              <PaintBrushIcon className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 bg-[rgba(20,20,30,0.95)] backdrop-blur-xl border border-white/30 rounded-lg p-2 z-20">
                <div className="grid grid-cols-4 gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        execCommand('foreColor', color);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-white/30 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-white/30 pr-2">
            <button onClick={() => setTextAlign('left')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-xs text-white">
              ←
            </button>
            <button onClick={() => setTextAlign('center')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-xs text-white">
              ↔
            </button>
            <button onClick={() => setTextAlign('right')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-xs text-white">
              →
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-white/30 pr-2">
            <button onClick={() => insertList('bullet')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white" title="Bullet List">
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button onClick={() => insertList('number')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-xs text-white" title="Numbered List">
              1.
            </button>
            <button onClick={() => insertList('todo')} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white" title="Todo List">
              <CheckIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-white/30 pr-2">
            {[1, 2, 3].map(level => (
              <button
                key={level}
                onClick={() => insertHeading(level)}
                className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm transition-all text-white font-bold"
                title={`Heading ${level} (${level === 1 ? '28px' : level === 2 ? '24px' : '20px'})`}
                style={{ fontSize: level === 1 ? '14px' : level === 2 ? '13px' : '12px' }}
              >
                H{level}
              </button>
            ))}
          </div>

          {/* Special Elements */}
          <div className="flex items-center gap-1">
            <button onClick={onCodeHistoryOpen} className="p-2 hover:bg-white/20 rounded-lg transition-all text-white" title="Insert Code from History">
              <CodeBracketIcon className="w-4 h-4" />
            </button>
            
            <label className="p-2 hover:bg-white/20 rounded-lg transition-all cursor-pointer text-white" title="Upload Image">
              <PhotoIcon className="w-4 h-4" />
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
            </label>
          </div>
        </div>

        {/* Second Row - Line Height */}
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">Line Height:</span>
            <select 
              value={lineHeight} 
              onChange={(e) => setLineHeight(e.target.value)}
              className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white"
            >
              <option value="1" className="bg-gray-800 text-white">Single</option>
              <option value="1.5" className="bg-gray-800 text-white">1.5x</option>
              <option value="2" className="bg-gray-800 text-white">Double</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={editorRef}
        value={content || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 p-4 text-white bg-transparent focus:outline-none overflow-y-auto min-h-64 resize-none border-none"
        style={{ 
          fontSize: `${fontSize}px`, 
          fontFamily: fontFamily, 
          textAlign: textAlign, 
          lineHeight: lineHeight
        }}
      />


    </div>
  );
};

export default RichTextEditor;