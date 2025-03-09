'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, Radar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as Recharts from 'recharts';

// Add dark theme colors to the chart templates
const CHART_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#EF4444', '#14B8A6'];

// Default chart code templates for auto-generation
const CHART_TEMPLATES = {
  BarChart: (data, xKey, valueKey) => `
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="${xKey}" tick={{ fill: '#E5E7EB' }} />
        <YAxis tick={{ fill: '#E5E7EB' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
        <Legend wrapperStyle={{ color: '#E5E7EB' }} />
        <Bar dataKey="${valueKey}" fill="#8B5CF6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `,
  
  LineChart: (data, xKey, valueKey) => `
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="${xKey}" tick={{ fill: '#E5E7EB' }} />
        <YAxis tick={{ fill: '#E5E7EB' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
        <Legend wrapperStyle={{ color: '#E5E7EB' }} />
        <Line type="monotone" dataKey="${valueKey}" stroke="#8B5CF6" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `,
  
  PieChart: (data, nameKey, valueKey) => `
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#EF4444', '#14B8A6'];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="${valueKey}"
          nameKey="${nameKey}"
          label={({ name, percent }) => \`\${name}: \${(percent * 100).toFixed(0)}%\`}
        >
          {data.map((entry, index) => (
            <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
        <Legend wrapperStyle={{ color: '#E5E7EB' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `,
  
  ScatterChart: (data, xKey, yKey) => `
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#374151" />
        <XAxis type="number" dataKey="${xKey}" name="${xKey}" tick={{ fill: '#E5E7EB' }} />
        <YAxis type="number" dataKey="${yKey}" name="${yKey}" tick={{ fill: '#E5E7EB' }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
        <Legend wrapperStyle={{ color: '#E5E7EB' }} />
        <Scatter name="${yKey} vs ${xKey}" data={data} fill="#8B5CF6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `,
  
  AreaChart: (data, xKey, valueKey) => `
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="${xKey}" tick={{ fill: '#E5E7EB' }} />
        <YAxis tick={{ fill: '#E5E7EB' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }} />
        <Legend wrapperStyle={{ color: '#E5E7EB' }} />
        <Area type="monotone" dataKey="${valueKey}" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `,
  
  HeatmapChart: (data) => `
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DynamicChart({ data }) {
  // Transform data for heatmap
  const transformedData = data.map(item => ({
    x: item.column1,
    y: item.column2,
    z: Math.abs(item.correlation * 100),
    value: item.correlation
  }));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#374151" />
        <XAxis type="category" dataKey="x" name="Column 1" tick={{ fill: '#E5E7EB' }} />
        <YAxis type="category" dataKey="y" name="Column 2" tick={{ fill: '#E5E7EB' }} />
        <ZAxis type="number" dataKey="z" range={[0, 400]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }}
          formatter={(value, name, props) => [props.payload.value.toFixed(2), 'Correlation']}
        />
        <Scatter 
          data={transformedData} 
          fill={(entry) => entry.value > 0 ? '#8B5CF6' : '#EF4444'}
          shape="square"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

render(<DynamicChart data={data} />);
  `
};

// Simple direct chart rendering component - no code evaluation
export default function ChartPreview({ code, data, theme, autoGenerate = false }) {
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('BarChart');
  const [chartConfig, setChartConfig] = useState({
    xAxisKey: 'name',
    valueKey: 'value',
    title: 'Chart Visualization'
  });
  const [chartCode, setChartCode] = useState('');
  
  // Default dark theme
  const defaultTheme = {
    primary: '#8B5CF6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#111827',
    card: '#1F2937',
    text: '#E5E7EB',
    border: '#374151',
  };
  
  const t = theme || defaultTheme;
  
  // Extract chart configuration from code
  useEffect(() => {
    if (code) {
      try {
        console.log("Analyzing code to determine chart type and config");
        
        // Determine chart type
        let detectedType = 'BarChart';
        if (code.includes('BarChart')) detectedType = 'BarChart';
        else if (code.includes('LineChart')) detectedType = 'LineChart';
        else if (code.includes('AreaChart')) detectedType = 'AreaChart';
        else if (code.includes('PieChart')) detectedType = 'PieChart';
        else if (code.includes('ScatterChart')) detectedType = 'ScatterChart';
        else if (code.includes('RadarChart')) detectedType = 'RadarChart';
        else if (code.includes('ComposedChart')) detectedType = 'ComposedChart';
        
        setChartType(detectedType);
        
        // Extract dataKey for X axis
        const xAxisMatch = code.match(/dataKey=["']([^"']+)["']/);
        const xAxisKey = xAxisMatch ? xAxisMatch[1] : 'name';
        
        // Extract value keys
        let valueKey = 'value';
        if (code.includes('dataKey="value"')) valueKey = 'value';
        else if (code.includes('dataKey="count"')) valueKey = 'count';
        else {
          // Try to find other dataKeys
          const dataKeyMatch = code.match(/dataKey=["']([^"']+)["']/g);
          if (dataKeyMatch && dataKeyMatch.length > 1) {
            const secondDataKey = dataKeyMatch[1].match(/["']([^"']+)["']/)[1];
            if (secondDataKey !== xAxisKey) {
              valueKey = secondDataKey;
            }
          }
        }
        
        // Extract title
        const titleMatch = code.match(/<h3[^>]*>([^<]+)<\/h3>/);
        const title = titleMatch ? titleMatch[1] : 'Chart Visualization';
        
        setChartConfig({
          xAxisKey,
          valueKey,
          title
        });
        
        console.log(`Detected chart: ${detectedType}, xAxis: ${xAxisKey}, value: ${valueKey}`);
        setError(null);
      } catch (err) {
        console.error('Error analyzing chart code:', err);
        setError(`Error analyzing chart code: ${err.message}`);
      }
    }
  }, [code]);

  useEffect(() => {
    if (autoGenerate && chartType && data) {
      // Auto-generate chart code based on the data and chart type
      try {
        const firstItem = data[0] || {};
        const keys = Object.keys(firstItem);
        
        // Find appropriate keys for the chart
        const numericKeys = keys.filter(key => 
          typeof firstItem[key] === 'number' || 
          !isNaN(parseFloat(firstItem[key]))
        );
        
        const categoryKeys = keys.filter(key => 
          typeof firstItem[key] === 'string' || 
          key === 'name' || 
          key === 'category' || 
          key === 'column1' || 
          key === 'column2'
        );
        
        // Select appropriate keys based on chart type
        let generatedCode = '';
        
        if (chartType === 'HeatmapChart') {
          generatedCode = CHART_TEMPLATES.HeatmapChart(data);
        } else if (chartType === 'ScatterChart' && numericKeys.length >= 2) {
          generatedCode = CHART_TEMPLATES.ScatterChart(data, numericKeys[0], numericKeys[1]);
        } else if (chartType === 'PieChart') {
          const nameKey = categoryKeys[0] || 'name';
          const valueKey = numericKeys[0] || 'value';
          generatedCode = CHART_TEMPLATES.PieChart(data, nameKey, valueKey);
        } else {
          // For other chart types (Bar, Line, Area)
          const xKey = categoryKeys[0] || 'name';
          const valueKey = numericKeys[0] || 'value';
          
          if (chartType === 'LineChart') {
            generatedCode = CHART_TEMPLATES.LineChart(data, xKey, valueKey);
          } else if (chartType === 'AreaChart') {
            generatedCode = CHART_TEMPLATES.AreaChart(data, xKey, valueKey);
          } else {
            // Default to BarChart
            generatedCode = CHART_TEMPLATES.BarChart(data, xKey, valueKey);
          }
        }
        
        setChartCode(generatedCode);
        setError(null);
      } catch (err) {
        console.error('Error auto-generating chart:', err);
        setError('Failed to auto-generate chart. Please check the data format.');
      }
    } else if (code) {
      // Use the provided code
      setChartCode(code);
      setError(null);
    }
  }, [code, data, chartType, autoGenerate]);

  // Function to download chart as SVG or PNG
  const downloadChart = (format) => {
    if (!chartRef.current) return;
    
    try {
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG element found');
        return;
      }
      
      if (format === 'svg') {
        // Download as SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'chart.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      } else if (format === 'png') {
        // Download as PNG
        const canvas = document.createElement('canvas');
        const svgRect = svgElement.getBoundingClientRect();
        canvas.width = svgRect.width;
        canvas.height = svgRect.height;
        const ctx = canvas.getContext('2d');
        
        // Create an image from the SVG
        const img = new Image();
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(svgUrl);
          
          // Convert canvas to PNG
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'chart.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        };
        
        img.src = svgUrl;
      }
    } catch (err) {
      console.error('Error downloading chart:', err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-md" 
        style={{ backgroundColor: t.background }}>
        <p style={{ color: t.text }}>No data available to display chart</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-md p-4"
        style={{ backgroundColor: '#7F1D1D' }}>
        <p style={{ color: '#FCA5A5' }}>Error rendering chart: {error}</p>
        <button 
          className="mt-4 px-4 py-2 rounded-md text-sm"
          style={{ backgroundColor: t.background, color: t.text }}
          onClick={() => setError(null)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Determine the first string key and first number key for fallback
  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  const stringKeys = keys.filter(k => typeof firstItem[k] === 'string');
  const numberKeys = keys.filter(k => typeof firstItem[k] === 'number' || !isNaN(Number(firstItem[k])));
  
  const xKey = chartConfig.xAxisKey || (stringKeys.length > 0 ? stringKeys[0] : 'name');
  const yKey = chartConfig.valueKey || (numberKeys.length > 0 ? numberKeys[0] : 'value');

  // Render the appropriate chart based on the detected type
  const renderChart = () => {
    const colors = [t.primary, t.secondary, t.accent, '#EC4899', '#3B82F6', '#EF4444'];
    
    switch (chartType) {
      case 'BarChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke={t.text} />
              <YAxis stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Bar dataKey={yKey} fill={t.primary} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'LineChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke={t.text} />
              <YAxis stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Line type="monotone" dataKey={yKey} stroke={t.primary} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'AreaChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke={t.text} />
              <YAxis stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Area type="monotone" dataKey={yKey} stroke={t.primary} fill={t.primary} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'PieChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill={t.primary}
                dataKey={yKey}
                nameKey={xKey}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'ScatterChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} type="category" name={xKey} stroke={t.text} />
              <YAxis dataKey={yKey} name={yKey} stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} cursor={{ strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Scatter name={yKey} data={data} fill={t.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        );
        
      case 'RadarChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={data}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey={xKey} tick={{ fill: t.text }} />
              <PolarRadiusAxis stroke={t.text} />
              <Radar name={yKey} dataKey={yKey} stroke={t.primary} fill={t.primary} fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      case 'ComposedChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke={t.text} />
              <YAxis stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Bar dataKey={yKey} barSize={20} fill={t.primary} />
              <Line type="monotone" dataKey={yKey} stroke={t.accent} />
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={xKey} stroke={t.text} />
              <YAxis stroke={t.text} />
              <Tooltip contentStyle={{ backgroundColor: t.card, color: t.text, border: `1px solid ${t.border}` }} />
              <Legend wrapperStyle={{ color: t.text }} />
              <Bar dataKey={yKey} fill={t.primary} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="chart-preview h-full">
      <div className="flex justify-end mb-2 space-x-2">
        <button 
          onClick={() => downloadChart('svg')}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            SVG
          </span>
        </button>
        <button 
          onClick={() => downloadChart('png')}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG
          </span>
        </button>
      </div>
      
      <div ref={chartRef} className="h-[calc(100%-30px)] w-full">
        <LiveProvider
          code={chartCode}
          scope={{
            ...Recharts,
            data,
            React: { createElement: Recharts.createElement }
          }}
          noInline={true}
        >
          <div className="h-full w-full">
            <LivePreview />
            <LiveError 
              style={{
                padding: '8px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                fontSize: '12px',
                borderRadius: '4px',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '100px'
              }}
            />
          </div>
        </LiveProvider>
      </div>
    </div>
  );
} 