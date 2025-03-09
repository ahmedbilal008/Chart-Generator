'use client';

import { useState } from 'react';

export default function QueryInput({ value, onChange, onSubmit, isLoading, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Enter your query here..."}
        className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-700 text-white placeholder-gray-400"
        rows={3}
        disabled={isLoading}
      />
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Press Ctrl+Enter to submit
        </span>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            'Generate Chart'
          )}
        </button>
      </div>
    </div>
  );
} 