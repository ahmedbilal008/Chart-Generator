'use client';

import { useEffect } from 'react';
import AceEditor from 'react-ace';

// Import Ace editor modes and themes
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-jsx';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';

export default function CodeDisplay({ code, onChange }) {
  // Determine if we're in JSX mode based on the code content
  const isJSX = code && (code.includes('React') || code.includes('jsx') || code.includes('<'));
  
  return (
    <div className="h-full w-full">
      <AceEditor
        mode={isJSX ? 'jsx' : 'javascript'}
        theme="monokai"
        onChange={onChange}
        value={code}
        name="code-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          showPrintMargin: false,
          fontSize: 14,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 