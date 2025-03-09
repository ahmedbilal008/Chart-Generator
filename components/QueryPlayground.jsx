'use client';

import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import DataUploader from './DataUploader';
import QueryInput from './QueryInput';
import CodeDisplay from './CodeDisplay';
import ChartPreview from './ChartPreview';
import DataInsights from './DataInsights';
import { processQuery, analyzeData, checkServerStatus } from '../services/api';

// Initialize the Gemini API with a check for client-side rendering
const genAI =
  typeof window !== 'undefined'
    ? new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'dummy-key')
    : null;

// Available chart types in Recharts
const CHART_TYPES = [
  { value: 'BarChart', label: 'Bar Chart' },
  { value: 'LineChart', label: 'Line Chart' },
  { value: 'AreaChart', label: 'Area Chart' },
  { value: 'PieChart', label: 'Pie Chart' },
  { value: 'RadarChart', label: 'Radar Chart' },
  { value: 'ScatterChart', label: 'Scatter Chart' },
  { value: 'ComposedChart', label: 'Composed Chart' }
];

// Header component
function Header() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
      <h1 className="text-3xl font-bold mb-2">Natural Language Query Playground</h1>
      <p className="opacity-90">
        Ask questions about your data in plain English and get visualizations powered by Gemini AI
      </p>
    </div>
  );
}

export default function QueryPlayground() {
  const [userQuery, setUserQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const [dataSummary, setDataSummary] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editableCode, setEditableCode] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('BarChart');
  const [dataLimit, setDataLimit] = useState(50); // Default to 50 data points
  const [insights, setInsights] = useState([]);
  const [additionalCharts, setAdditionalCharts] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);
  const [geminiKeyValid, setGeminiKeyValid] = useState(true);

  // Sample data for testing
  const [sampleData, setSampleData] = useState([
    { category: 'Electronics', sales: 4000, profit: 2400, month: 'Jan' },
    { category: 'Books', sales: 3000, profit: 1398, month: 'Jan' },
    { category: 'Clothing', sales: 2000, profit: 9800, month: 'Jan' },
    { category: 'Home', sales: 2780, profit: 3908, month: 'Jan' },
    { category: 'Electronics', sales: 1890, profit: 4800, month: 'Feb' },
    { category: 'Books', sales: 2390, profit: 3800, month: 'Feb' },
    { category: 'Clothing', sales: 3490, profit: 4300, month: 'Feb' },
    { category: 'Home', sales: 3490, profit: 4300, month: 'Feb' },
    { category: 'Electronics', sales: 2490, profit: 4300, month: 'Mar' },
    { category: 'Books', sales: 2490, profit: 4300, month: 'Mar' },
    { category: 'Clothing', sales: 2490, profit: 4300, month: 'Mar' },
    { category: 'Home', sales: 4490, profit: 7300, month: 'Mar' },
  ]);

  // Set isMounted to true after component mounts and check server status
  useEffect(() => {
    setIsMounted(true);
    
    // Check if Gemini API key is valid
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      setGeminiKeyValid(false);
      setError('Gemini API key is not set. Please add your API key to .env.local file.');
    }
    
    // Check server status
    const checkServer = async () => {
      try {
        const isRunning = await checkServerStatus();
        setServerStatus(isRunning);
      } catch (err) {
        console.error('Error checking server status:', err);
        setServerStatus(false);
      }
    };
    
    checkServer();
  }, []);

  // Handle data upload
  const handleDataUpload = async (data, summary = null) => {
    setUserData(data);
    
    // If summary is provided from the backend, use it
    if (summary) {
      setDataSummary(summary);
    } 
    // Otherwise, get insights from the backend if it's available
    else if (data && serverStatus) {
      try {
        const result = await analyzeData(data);
        setDataSummary(result);
      } catch (error) {
        console.error('Error analyzing data:', error);
      }
    }
    
    // Reset other states
    setGeneratedCode('');
    setEditableCode('');
    setUserQuery('');
    setInsights([]);
    setAdditionalCharts([]);
    setError(null);
  };

  // Handle query submission
  const handleQuerySubmit = async () => {
    if (!userQuery.trim() || !userData) {
      setError('Please enter a query and upload data first.');
      return;
    }
    
    if (!geminiKeyValid) {
      setError('Gemini API key is not set. Please add your API key to .env.local file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let processedData = userData;
      let suggestedVisualization = selectedChartType;
      let dataInsights = [];
      
      // Process the query using the Python backend if available
      if (serverStatus) {
        try {
          const result = await processQuery(userData, userQuery, dataLimit);
          
          // Update the data with processed data from the backend
          processedData = result.processed_data;
          
          // Store insights
          dataInsights = result.insights || [];
          
          // Use the suggested visualization type if available
          if (result.suggested_visualization) {
            suggestedVisualization = result.suggested_visualization;
          }
          
          // Store additional charts if available
          if (result.charts) {
            setAdditionalCharts(result.charts);
          }
          
          setInsights(dataInsights);
        } catch (error) {
          console.error('Error processing query with backend:', error);
          // Fall back to using the original data
          processedData = userData;
        }
      } else {
        // If backend is not available, use the original data
        dataInsights = ['Backend server is not available. Using original data without processing.'];
        setInsights(dataInsights);
      }
      
      // Generate code using Gemini API
      await generateChartCode(processedData, userQuery, suggestedVisualization);
    } catch (error) {
      console.error('Error processing query:', error);
      setError(`Error processing query: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chart code using Gemini API
  const generateChartCode = async (data, query, chartType) => {
    try {
      // Create a prompt for Gemini
      const prompt = `
You are an expert in data visualization using React with the Recharts library.
Generate JavaScript code to visualize the following data using a ${chartType}:

Data: ${JSON.stringify(data, null, 2)}

User Query: "${query}"

Requirements:
1. Use the Recharts library
2. Return ONLY valid JSX code for a React component that renders the chart
3. Make the chart responsive and visually appealing
4. Include proper labels, tooltips, and legends
5. Choose appropriate colors that work well on a dark background
6. Handle the data exactly as provided, don't modify the structure
7. The component should be named "DynamicChart"
8. IMPORTANT: Ensure the chart is properly scaled by setting appropriate width and height
9. IMPORTANT: For ScatterChart, ensure points are properly sized and visible
10. IMPORTANT: If data contains very small values (e.g., scientific notation like 5.551115123125783e-17), treat them as 0

Return ONLY the component code, nothing else.
`;

      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract code from the response
      const codeMatch = text.match(/```(?:jsx|javascript)?\s*([\s\S]*?)```/) || 
                        text.match(/```(?:jsx|javascript)?\s*([\s\S]*)/);
      
      const cleanedCode = codeMatch ? codeMatch[1].trim() : text.trim();
      
      // Set the generated code
      setGeneratedCode(cleanedCode);
      setEditableCode(cleanedCode);
    } catch (error) {
      console.error('Error generating chart code:', error);
      setError(`Error generating chart code: ${error.message}`);
    }
  };

  // Handle code edit
  const handleCodeEdit = (newCode) => {
    setEditableCode(newCode);
  };

  // Handle running the edited code
  const handleRunCode = () => {
    setGeneratedCode(editableCode);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      
      {!geminiKeyValid && (
        <div className="bg-yellow-100 p-4 text-yellow-800">
          <div className="container mx-auto">
            <h2 className="font-bold text-lg">⚠️ Gemini API Key Not Set</h2>
            <p className="mt-1">
              You need to set your Gemini API key in the <code className="bg-yellow-50 px-1 py-0.5 rounded">.env.local</code> file.
            </p>
            <p className="mt-2">
              1. Get an API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
            </p>
            <p>
              2. Add it to your <code className="bg-yellow-50 px-1 py-0.5 rounded">.env.local</code> file:
              <code className="block bg-yellow-50 p-2 mt-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here</code>
            </p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Data Upload & Query */}
          <div className="lg:col-span-3 space-y-6">
            <DataUploader 
              onDataUpload={handleDataUpload} 
              sampleData={sampleData} 
            />
            
            <div className="bg-gray-800 rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 text-gray-100">Ask a Question</h2>
              <QueryInput 
                value={userQuery}
                onChange={setUserQuery}
                onSubmit={handleQuerySubmit}
                isLoading={isLoading}
                placeholder="e.g., Show a bar chart of sales by category"
              />
              
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Preferred Chart Type
                </label>
                <select
                  value={selectedChartType}
                  onChange={(e) => setSelectedChartType(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                  >
                    {CHART_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Data Points
                </label>
                  <input
                    type="number"
                    value={dataLimit}
                    onChange={(e) => setDataLimit(Math.max(5, parseInt(e.target.value) || 10))}
                    min="5"
                    max="1000"
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                  />
                </div>
              </div>

        {error && (
                <div className="mt-4 p-3 bg-red-900 text-red-100 rounded-md text-sm border border-red-700">
            {error}
          </div>
        )}
      </div>
          </div>

          {/* Middle Column - Code & Chart */}
          <div className="lg:col-span-6 space-y-6">
            {/* Generated Code */}
            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-700 px-4 py-3 flex justify-between items-center">
                <h3 className="font-medium text-gray-200">Generated Code</h3>
                <button
                  onClick={handleRunCode}
                  disabled={!editableCode}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    editableCode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Run Code
                </button>
              </div>
              <div className="h-80">
                <CodeDisplay 
                  code={editableCode || '// No code generated yet. Upload data and ask a question to generate code.'}
                  onChange={handleCodeEdit} 
                />
              </div>
            </div>
            
            {/* Chart Preview */}
            <div className="bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="font-medium text-gray-200 mb-4">Chart Preview</h3>
              {isMounted && (
                <div className="h-96 flex items-center justify-center">
                  {generatedCode ? (
                    <ChartPreview 
                      code={generatedCode} 
                      data={userData || []} 
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-lg">No chart generated yet</p>
                      <p className="text-sm mt-2">Upload data and ask a question to generate a chart</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Charts */}
            {additionalCharts.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-md p-4">
                <h3 className="font-medium text-gray-200 mb-4">Additional Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalCharts.map((chart, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg p-3">
                      <h4 className="font-medium text-gray-300 mb-2">{chart.title}</h4>
                      <div className="h-64">
                        <ChartPreview 
                          chartType={chart.type}
                          data={chart.data}
                          autoGenerate={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Data Insights */}
          <div className="lg:col-span-3 space-y-6">
            {/* Data Insights Panel */}
            <div className="bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-100">Data Insights</h3>
              {(insights.length > 0 || dataSummary) ? (
                <DataInsights 
                  insights={insights} 
                  dataSummary={dataSummary} 
                />
              ) : (
                <div className="text-gray-400 text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No insights available yet</p>
                  <p className="text-sm mt-2">Upload data and ask a question to generate insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
