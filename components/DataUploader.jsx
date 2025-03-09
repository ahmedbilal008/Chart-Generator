'use client';

import { useState, useEffect } from 'react';
import { uploadCSV, uploadJSON, checkServerStatus } from '../services/api';

export default function DataUploader({ onDataUpload, sampleData, theme }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [serverStatus, setServerStatus] = useState(null);
  
  // Default dark theme
  const defaultTheme = {
    primary: '#8B5CF6',
    secondary: '#10B981',
    background: '#1F2937',
    card: '#111827',
    text: '#E5E7EB',
    border: '#374151',
  };
  
  const t = theme || defaultTheme;

  // Check server status on component mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const isRunning = await checkServerStatus();
        setServerStatus(isRunning);
        if (!isRunning) {
          setError('Backend server is not running. Please start the server and try again.');
        }
      } catch (err) {
        console.error('Error checking server status:', err);
        setServerStatus(false);
        setError('Could not connect to the backend server. Please make sure it is running.');
      }
    };
    
    checkServer();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    setFileName(file.name);
    
    try {
      // Check server status first
      if (serverStatus === false) {
        throw new Error('Backend server is not running. Please start the server and try again.');
      }
      
      let result;
      
      // Check if it's a CSV file
      if (file.name.endsWith('.csv')) {
        result = await uploadCSV(file);
      } 
      // Check if it's a JSON file
      else if (file.name.endsWith('.json')) {
        result = await uploadJSON(file);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or JSON file.');
      }
      
      // Pass data and summary to parent component
      onDataUpload(result.data, result.summary);
      setSuccessMessage(`Successfully loaded ${file.name}`);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const useSampleData = () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Use the sample data provided by the parent component
      if (sampleData) {
        onDataUpload(sampleData);
        setSuccessMessage('Successfully loaded sample data');
        setFileName('sample-data.json');
      } else {
        throw new Error('Sample data not available');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg shadow-md overflow-hidden bg-gray-800 border border-gray-700">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Upload Your Data</h2>
        
        {serverStatus === false && (
          <div className="p-3 mb-4 rounded-lg bg-yellow-900 text-yellow-200 text-sm border border-yellow-700">
            <p className="font-medium">Backend server is not running</p>
            <p className="mt-1">You can still use sample data, but file uploads won't work until the server is started.</p>
            <p className="mt-2 text-xs">Run <code className="bg-yellow-950 px-1 py-0.5 rounded">npm run start:all</code> to start both frontend and backend.</p>
          </div>
        )}
        
        <div className="space-y-4">
          {/* File upload */}
          <div>
            <label 
              htmlFor="file-upload" 
              className={`block w-full cursor-pointer text-center py-3 px-4 rounded-lg border-2 border-dashed transition-colors ${serverStatus === false ? 'opacity-50' : ''}`}
              style={{ 
                borderColor: '#4B5563', 
                color: '#E5E7EB',
                backgroundColor: '#111827'
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium">
                  {isLoading ? 'Uploading...' : 'Click to upload CSV or JSON'}
                </span>
                <span className="text-xs mt-1 opacity-70">
                  or drag and drop
                </span>
              </div>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                accept=".csv,.json" 
                className="sr-only" 
                onChange={handleFileUpload}
                disabled={isLoading || serverStatus === false}
              />
            </label>
          </div>
          
          {/* Sample data button */}
          <div>
            <button
              onClick={useSampleData}
              disabled={isLoading || !sampleData}
              className="w-full py-2 px-4 rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#8B5CF6',
                color: 'white',
                opacity: isLoading || !sampleData ? 0.7 : 1
              }}
            >
              Use Sample Data
            </button>
          </div>
          
          {/* Status messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900 text-red-200 text-sm border border-red-700">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-900 text-green-200 text-sm border border-green-700">
              {successMessage}
            </div>
          )}
          
          {fileName && !error && (
            <div className="p-3 rounded-lg text-sm bg-gray-700 text-gray-200">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{fileName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 