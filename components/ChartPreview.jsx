'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, Radar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Simple direct chart rendering component - no code evaluation
export default function ChartPreview({ code, data, theme }) {
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('BarChart');
  const [chartConfig, setChartConfig] = useState({
    xAxisKey: 'name',
    valueKey: 'value',
    title: 'Chart Visualization'
  });
  
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

  const downloadChart = (format) => {
    if (!chartRef.current) {
      setError("Chart reference not found");
      return;
    }
    
    try {
      const svg = chartRef.current.querySelector('svg');
      if (!svg) {
        setError("No SVG element found in the chart.");
        return;
      }
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      
      if (format === 'svg') {
        // Download as SVG
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'chart.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        // Convert to PNG and download
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'chart.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    } catch (err) {
      console.error('Error downloading chart:', err);
      setError(`Error downloading chart: ${err.message}`);
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
    <div className="chart-preview">
      <div className="hidden">
        <button onClick={() => downloadChart('svg')}>SVG</button>
        <button onClick={() => downloadChart('png')}>PNG</button>
      </div>
      <div ref={chartRef} className="rounded-md overflow-auto h-96"
        style={{ backgroundColor: t.background, padding: '1rem' }}>
        <div style={{ width: '100%', height: '100%' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '10px', color: t.text }}>{chartConfig.title || `${chartType.replace('Chart', '')} Chart`}</h3>
          <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  );
} 