'use client';

import { useState } from 'react';

export default function DataUploader({ onDataUpload, sampleData, theme }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Default dark theme
  const defaultTheme = {
    primary: '#8B5CF6',
    secondary: '#10B981',
    background: '#111827',
    card: '#1F2937',
    text: '#E5E7EB',
    border: '#374151',
  };
  
  const t = theme || defaultTheme;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        
        // Check if it's a CSV file
        if (file.name.endsWith('.csv')) {
          const data = parseCSV(text);
          onDataUpload(data);
          setError(null);
          setSuccessMessage(`Successfully loaded ${file.name}`);
        } 
        // Check if it's a JSON file
        else if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          onDataUpload(data);
          setError(null);
          setSuccessMessage(`Successfully loaded ${file.name}`);
        } 
        else {
          setError('Unsupported file format. Please upload a CSV or JSON file.');
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse the file. Please check the format.');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(value => value.trim());
      const entry = {};
      
      headers.forEach((header, index) => {
        // Try to convert to number if possible
        const value = values[index];
        entry[header] = isNaN(value) ? value : Number(value);
      });
      
      result.push(entry);
    }
    
    return result;
  };

  const useSampleData = () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    setFileName('');
    
    // Simulate a small delay to show loading state
    setTimeout(() => {
      onDataUpload(sampleData);
      setSuccessMessage('Sample data loaded successfully');
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-md p-6 text-center" 
        style={{ borderColor: t.border, backgroundColor: t.background }}>
        <input
          type="file"
          id="file-upload"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer hover:underline"
          style={{ color: t.primary }}
        >
          Upload CSV or JSON file
        </label>
        <p className="text-sm mt-1 opacity-70" style={{ color: t.text }}>
          or drag and drop file here
        </p>
        
        {fileName && (
          <p className="text-sm mt-2" style={{ color: t.text }}>
            Selected file: {fileName}
          </p>
        )}
      </div>
      
      <button
        onClick={useSampleData}
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-md font-medium"
        style={{ 
          backgroundColor: isLoading ? '#4B5563' : t.background,
          color: t.text,
          border: `1px solid ${t.border}`,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Loading...' : 'Use Sample Data'}
      </button>
      
      {isLoading && (
        <div className="p-3 rounded-md text-sm flex items-center"
          style={{ backgroundColor: `${t.primary}20`, color: t.primary }}>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" style={{ color: t.primary }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing data...
        </div>
      )}
      
      {successMessage && !isLoading && (
        <div className="p-3 rounded-md text-sm"
          style={{ backgroundColor: `${t.secondary}20`, color: t.secondary }}>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="p-3 rounded-md text-sm"
          style={{ backgroundColor: '#7F1D1D', color: '#FCA5A5' }}>
          {error}
        </div>
      )}
    </div>
  );
} 