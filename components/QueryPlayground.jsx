'use client';

import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import DataUploader from './DataUploader';
import QueryInput from './QueryInput';
import CodeDisplay from './CodeDisplay';
import ChartPreview from './ChartPreview';

// Initialize the Gemini API with a check for client-side rendering
const genAI =
  typeof window !== 'undefined'
    ? new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
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
  const [sampleData, setSampleData] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editableCode, setEditableCode] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('BarChart');
  const [dataLimit, setDataLimit] = useState(10); // Default to 10 data points

  // Dark theme
  const theme = {
    primary: '#8B5CF6', // Purple
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    background: '#111827', // Dark gray
    card: '#1F2937', // Darker gray
    text: '#E5E7EB', // Light gray
    border: '#374151', // Medium gray border
    gradient: 'linear-gradient(to right, #8B5CF6, #6366F1)' // Purple to indigo gradient
  };

  // Load sample data on component mount
  useEffect(() => {
    setIsMounted(true);
    const defaultData = [
      { name: 'North', value: 4000 },
      { name: 'South', value: 3000 },
      { name: 'East', value: 2000 },
      { name: 'West', value: 1000 }
    ];
    
    setSampleData(defaultData);
    setUserData(defaultData);
  }, []);

  // Function to aggregate data for better visualization
  const aggregateData = (data, maxEntries = 15) => {
    if (!data || data.length <= maxEntries) return data;

    const firstItem = data[0];
    const keys = Object.keys(firstItem);

    // Special handling for medical datasets (e.g., diabetes dataset)
    if (keys.includes('Outcome') || keys.includes('Age')) {
      if (keys.includes('Outcome')) {
        const aggregated = [
          { category: 'Positive (1)', count: 0 },
          { category: 'Negative (0)', count: 0 }
        ];

        data.forEach(item => {
          if (item.Outcome === 1 || item.Outcome === '1') {
            aggregated[0].count++;
          } else {
            aggregated[1].count++;
          }
        });
        return aggregated;
      }

      if (keys.includes('Age')) {
        const ageRanges = {
          '20-29': { category: '20-29', count: 0 },
          '30-39': { category: '30-39', count: 0 },
          '40-49': { category: '40-49', count: 0 },
          '50-59': { category: '50-59', count: 0 },
          '60+': { category: '60+', count: 0 }
        };

        data.forEach(item => {
          const age = Number(item.Age);
          if (age < 30) ageRanges['20-29'].count++;
          else if (age < 40) ageRanges['30-39'].count++;
          else if (age < 50) ageRanges['40-49'].count++;
          else if (age < 60) ageRanges['50-59'].count++;
          else ageRanges['60+'].count++;
        });
        return Object.values(ageRanges);
      }
    }

    // Look for numeric fields that can be aggregated
    const numericFields = keys.filter(
      key => typeof firstItem[key] === 'number' || !isNaN(Number(firstItem[key]))
    );
    // Look for potential category fields
    const categoryFields = keys.filter(
      key => typeof firstItem[key] === 'string' && !numericFields.includes(key)
    );

    if (numericFields.length > 0 && categoryFields.length > 0) {
      const categoryField = categoryFields[0];
      const numericField = numericFields[0];

      const aggregated = {};
      data.forEach(item => {
        const category = item[categoryField];
        if (!aggregated[category]) {
          aggregated[category] = { [categoryField]: category, [numericField]: 0, count: 0 };
        }
        aggregated[category][numericField] += Number(item[numericField]);
        aggregated[category].count += 1;
      });

      const result = Object.values(aggregated)
        .sort((a, b) => b[numericField] - a[numericField])
        .slice(0, maxEntries);
      return result;
    }

    if (numericFields.length > 0) {
      const result = [];
      numericFields.forEach(field => {
        const sum = data.reduce((acc, item) => acc + Number(item[field] || 0), 0);
        const avg = sum / data.length;
        result.push({
          metric: field,
          average: parseFloat(avg.toFixed(2)),
          count: data.length
        });
      });
      return result;
    }

    return data.slice(0, maxEntries);
  };

  const handleQuerySubmit = async () => {
    if (!genAI) {
      setError('API client not initialized. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rawData = userData || sampleData;
      
      // Aggregate data for better visualization - limit to user-selected number of items
      const aggregatedData = aggregateData(rawData).slice(0, dataLimit);
      const dataString = JSON.stringify(aggregatedData, null, 2);
      
      // Analyze the data structure to find appropriate keys
      const firstItem = aggregatedData[0];
      const keys = Object.keys(firstItem);
      const potentialXAxisKeys = keys.filter(k => typeof firstItem[k] === 'string' || k === 'category' || k === 'name');
      const potentialValueKeys = keys.filter(k => typeof firstItem[k] === 'number' || k === 'count' || k === 'value');
      
      const xAxisKey = potentialXAxisKeys.length > 0 ? potentialXAxisKeys[0] : 'category';
      const valueKey = potentialValueKeys.length > 0 ? potentialValueKeys[0] : 'count';
      
      // Let Gemini generate the chart code with minimal guidance
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
You are an expert in data visualization using React with the Recharts library.

I need you to create a ${selectedChartType} visualization for this data:
${dataString}

${userQuery ? `The user wants: "${userQuery}"` : ''}

IMPORTANT GUIDELINES:
1. Create a React functional component that uses Recharts to visualize the data
2. The data has been limited to ${dataLimit} items for performance reasons so add these aggregated datapoints to the returned code.
3. Use a dark theme with colors like #8B5CF6 (purple), #10B981 (green), #F59E0B (amber)
4. Include a ResponsiveContainer for proper sizing
5. Add a title, tooltip, and legend
6. For text elements, use color: '#E5E7EB' for visibility on dark backgrounds
7. Use "${xAxisKey}" as the X-axis key and "${valueKey}" for the main value
8. MUST include a render call at the end: render(<YourComponent data={data} />);
9. Keep the code simple and focused on visualization

ONLY return the complete React component code, nothing else. No explanations or markdown.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();
        
        // Clean up the response
        const cleanedCode = cleanGeneratedCode(generatedText);
        
        // Validate the code has the essential elements
        if (cleanedCode && 
            cleanedCode.includes('import') && 
            cleanedCode.includes('ResponsiveContainer') && 
            cleanedCode.includes('render(')) {
          setGeneratedCode(cleanedCode);
          setEditableCode(cleanedCode);
        } else {
          throw new Error("Generated code is missing essential elements");
        }
      } catch (err) {
        console.error('Error generating visualization:', err);
        setError(`Failed to generate visualization: ${err.message || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Error processing data:', err);
      setError(`Error processing data: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get chart elements based on chart type
  const getChartElementsForType = (chartType, valueKey, xAxisKey = 'category') => {
    const colors = {
      primary: '#8B5CF6',
      secondary: '#10B981',
      accent: '#F59E0B',
      highlight: '#EC4899'
    };

    switch (chartType) {
      case 'BarChart':
        return {
          imports: 'Bar',
          content: `<Bar dataKey="${valueKey}" fill="${colors.primary}" />`
        };
      case 'LineChart':
        return {
          imports: 'Line',
          content: `<Line type="monotone" dataKey="${valueKey}" stroke="${colors.primary}" activeDot={{ r: 8 }} />`
        };
      case 'AreaChart':
        return {
          imports: 'Area',
          content: `<Area type="monotone" dataKey="${valueKey}" fill="${colors.primary}" stroke="${colors.primary}" fillOpacity={0.3} />`
        };
      case 'PieChart':
        return {
          imports: 'Pie, Cell',
          content: `<Pie data={data} dataKey="${valueKey}" nameKey="${xAxisKey}" cx="50%" cy="50%" outerRadius={80} fill="${colors.primary}" label>
            {data.map((entry, index) => (
              <Cell key={index} fill={['${colors.primary}', '${colors.secondary}', '${colors.accent}', '${colors.highlight}'][index % 4]} />
            ))}
          </Pie>`
        };
      case 'ScatterChart':
        return {
          imports: 'Scatter',
          content: `<Scatter name="${valueKey}" data={data} fill="${colors.primary}" />`
        };
      case 'RadarChart':
        return {
          imports: 'Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis',
          content: `<PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="${xAxisKey}" tick={{ fill: '#E5E7EB' }} />
          <PolarRadiusAxis tick={{ fill: '#E5E7EB' }} />
          <Radar name="${valueKey}" dataKey="${valueKey}" stroke="${colors.primary}" fill="${colors.primary}" fillOpacity={0.6} />`
        };
      case 'ComposedChart':
        return {
          imports: 'Bar, Line',
          content: `<Bar dataKey="${valueKey}" barSize={20} fill="${colors.primary}" />
          <Line type="monotone" dataKey="${valueKey}" stroke="${colors.accent}" />`
        };
      default:
        return {
          imports: 'Bar',
          content: `<Bar dataKey="${valueKey}" fill="${colors.primary}" />`
        };
    }
  };

  // Clean up generated code by removing render calls and ensuring export default
  const cleanGeneratedCode = (code) => {
    // Remove markdown code blocks if present
    let cleanedCode = code.replace(/```jsx|```js|```javascript|```/g, '').trim();
    
    // Remove any CommonJS module exports that might cause errors
    cleanedCode = cleanedCode.replace(/module\.exports\s*=\s*/g, '');
    
    // Handle the case where there's both a render call and an export default
    // Keep the render call and remove the export default
    if (cleanedCode.includes('render(') && cleanedCode.includes('export default')) {
      // Extract the component name from export default
      const exportMatch = cleanedCode.match(/export\s+default\s+(\w+)/);
      if (exportMatch && exportMatch[1]) {
        const componentName = exportMatch[1];
        // Remove the export default line
        cleanedCode = cleanedCode.replace(/export\s+default\s+\w+;?/g, '');
        
        // Make sure the render call uses the correct component name
        if (!cleanedCode.includes(`render(<${componentName}`)) {
          // If there's a render call with a different component, replace it
          cleanedCode = cleanedCode.replace(/render\s*\(\s*<\s*(\w+)/g, `render(<${componentName}`);
        }
      } else {
        // If we can't extract the component name, just remove the export default line
        cleanedCode = cleanedCode.replace(/export\s+default\s+\w+;?/g, '');
      }
    }
    
    // Remove any render method calls that might be causing issues
    cleanedCode = cleanedCode.replace(/\w+\.render\(\);?/g, '');
    
    // If there's no render call, add one
    if (!cleanedCode.includes('render(')) {
      // Find the component name
      const componentNameMatch = cleanedCode.match(/(?:function|const|class)\s+(\w+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'Chart';
      
      // If there's an export default but no render call, add a render call
      if (cleanedCode.includes('export default')) {
        const exportMatch = cleanedCode.match(/export\s+default\s+(\w+)/);
        if (exportMatch && exportMatch[1]) {
          const exportedName = exportMatch[1];
          cleanedCode = cleanedCode.replace(/export\s+default\s+\w+;?/g, '');
          cleanedCode += `\n\n// Add render call for react-live
render(<${exportedName} data={data} />);`;
        } else {
          cleanedCode = cleanedCode.replace(/export\s+default\s+/g, '');
          cleanedCode += `\n\n// Add render call for react-live
render(<${componentName} data={data} />);`;
        }
      } else {
        cleanedCode += `\n\n// Add render call for react-live
render(<${componentName} data={data} />);`;
      }
    }
    
    // Remove any hardcoded data arrays
    const dataArrayMatch = cleanedCode.match(/const\s+data\s*=\s*\[[\s\S]*?\];/);
    if (dataArrayMatch) {
      cleanedCode = cleanedCode.replace(dataArrayMatch[0], '');
    }
    
    // Remove document.getElementById references that won't work in the preview
    cleanedCode = cleanedCode.replace(/document\.getElementById\([^)]*\)/g, 'null');
    
    // Make sure the component accepts a data prop
    const componentMatch = cleanedCode.match(/(?:function|const)\s+(\w+)\s*\(\s*\)/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      cleanedCode = cleanedCode.replace(
        new RegExp(`(function|const)\\s+${componentName}\\s*\\(\\s*\\)`, 'g'),
        `$1 ${componentName} ({ data })`
      );
    }
    
    return cleanedCode;
  };

  const handleDataUpload = data => {
    setUserData(data);
    if (generatedCode) {
      setGeneratedCode('');
      setEditableCode('');
    }
  };

  const handleCodeChange = newCode => {
    setEditableCode(newCode);
  };

  const handleRunCode = () => {
    console.log('Running code:', editableCode.substring(0, 100) + '...');
    setGeneratedCode(editableCode);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div style={{ backgroundColor: theme.background, color: theme.text, minHeight: '100vh' }}>
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Top Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg shadow-md h-full" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>
                Data Source
              </h2>
              <DataUploader onDataUpload={handleDataUpload} sampleData={sampleData} theme={theme} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg shadow-md h-full" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>
                Chart Configuration
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                  Chart Type
                </label>
                <select
                  value={selectedChartType}
                  onChange={(e) => setSelectedChartType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  style={{ 
                    backgroundColor: theme.background, 
                    color: theme.text,
                    borderColor: theme.border 
                  }}
                >
                  {CHART_TYPES.map(chart => (
                    <option key={chart.value} value={chart.value}>
                      {chart.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                  Data Limit: {dataLimit} items
                </label>
                <div className="flex items-center">
                  <span className="mr-2 text-xs" style={{ color: theme.text }}>10</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={dataLimit}
                    onChange={(e) => setDataLimit(Number(e.target.value))}
                    className="w-full"
                    style={{
                      accentColor: theme.primary,
                    }}
                  />
                  <span className="ml-2 text-xs" style={{ color: theme.text }}>100</span>
                </div>
                <p className="text-xs mt-1 opacity-70" style={{ color: theme.text }}>
                  Adjust to control visualization performance
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                  Query (Optional)
                </label>
                <textarea
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                    boxShadow: 'none'
                  }}
                  rows="3"
                  placeholder="e.g., 'Show a bar chart of total values by name' or 'Create a pie chart showing the distribution of values'"
          value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                />
                <p className="text-sm mt-2 opacity-70" style={{ color: theme.text }}>
                  Enter a query to customize the chart or leave empty for basic visualization
                </p>
              </div>

              <button
                onClick={handleQuerySubmit}
                className="w-full py-2 px-4 rounded-md text-white font-medium"
                style={{ background: theme.gradient }}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Chart'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900 text-red-100 rounded-md mb-6 border border-red-700">
            {error}
          </div>
        )}
        
        {/* Main Content - Code and Chart side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Code Editor */}
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                React/Recharts Code
              </h2>
              <button onClick={handleRunCode} className="px-3 py-1 rounded-md text-sm text-white" style={{ backgroundColor: theme.secondary }}>
                Run
              </button>
            </div>
            <div style={{ height: '400px', backgroundColor: '#1E1E1E', borderRadius: '0.375rem', overflow: 'hidden' }}>
              <textarea
                value={editableCode}
                onChange={e => handleCodeChange(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm"
                style={{
                  backgroundColor: '#1E1E1E',
                  color: '#D4D4D4',
                  border: 'none',
                  resize: 'none',
                  outline: 'none'
                }}
        />
      </div>
          </div>

          {/* Right side - Chart Preview */}
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                Chart Preview
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => document.querySelector('.chart-preview button:first-child')?.click()}
                  className="px-3 py-1 rounded-md text-sm"
                  style={{ backgroundColor: `${theme.primary}30`, color: theme.primary }}
                >
                  SVG
                </button>
                <button
                  onClick={() => document.querySelector('.chart-preview button:nth-child(2)')?.click()}
                  className="px-3 py-1 rounded-md text-sm"
                  style={{ backgroundColor: `${theme.secondary}30`, color: theme.secondary }}
                >
                  PNG
                </button>
              </div>
            </div>

            <div>
              {generatedCode && <div className="mb-2 text-sm opacity-70" style={{ color: theme.text }}>Based on selected chart type:</div>}
              <ChartPreview code={generatedCode} data={userData || sampleData} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
