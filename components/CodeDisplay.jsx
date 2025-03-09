'use client';

import dynamic from 'next/dynamic';

// Dynamically import AceEditor to avoid SSR issues
const AceEditor = dynamic(
  async () => {
    const ace = await import('react-ace');
    await import('ace-builds/src-noconflict/mode-javascript');
    await import('ace-builds/src-noconflict/theme-github');
    await import('ace-builds/src-noconflict/ext-language_tools');
    return ace;
  },
  { ssr: false }
);

export default function CodeDisplay({ code, onChange, onRunCode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Generated Code</h2>
        <button
          onClick={onRunCode}
          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Run Code
        </button>
      </div>
      
      <div className="border border-gray-300 rounded-md overflow-hidden">
        {typeof window !== 'undefined' && (
          <AceEditor
            mode="javascript"
            theme="github"
            value={code}
            onChange={onChange}
            name="code-editor"
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
            width="100%"
            height="400px"
          />
        )}
      </div>
    </div>
  );
} 