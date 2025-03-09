'use client';

import { useState, useEffect } from 'react';

export default function DataInsights({ insights, dataSummary }) {
  const [activeTab, setActiveTab] = useState('insights');

  if (!insights && !dataSummary) {
    return null;
  }

  return (
    <div className="bg-transparent">
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'insights'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'summary'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Data Summary
        </button>
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-200">Key Insights</h3>
          {insights && insights.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-gray-300">
                  {insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No insights available.</p>
          )}
        </div>
      )}

      {activeTab === 'summary' && dataSummary && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="bg-gray-700 rounded-lg p-3 flex-1 mr-2">
              <h4 className="font-medium text-blue-300">Rows</h4>
              <p className="text-2xl font-bold text-blue-400">{dataSummary.row_count}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 flex-1 ml-2">
              <h4 className="font-medium text-purple-300">Columns</h4>
              <p className="text-2xl font-bold text-purple-400">{dataSummary.column_count}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-200 mb-2">Column Details</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Unique Values
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Statistics
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {dataSummary.columns.map((column, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-200">
                        {column.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {column.type}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {column.unique_values}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                        {column.min_value !== undefined && (
                          <div>
                            Min: {column.min_value.toFixed(2)}, Max: {column.max_value.toFixed(2)}
                            <br />
                            Mean: {column.mean_value.toFixed(2)}, Median: {column.median_value.toFixed(2)}
                          </div>
                        )}
                        {column.sample_values && column.sample_values.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Sample: {column.sample_values.slice(0, 3).join(', ')}
                            {column.sample_values.length > 3 ? '...' : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {dataSummary.correlation_matrix && (
            <div>
              <h4 className="font-semibold text-gray-200 mb-2">Correlation Matrix</h4>
              <div className="bg-gray-700 p-3 rounded-lg text-sm">
                <p className="text-gray-300 mb-2">
                  Showing correlations between numerical columns. Values range from -1 (strong negative correlation) to 1 (strong positive correlation).
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-300">Column</th>
                        {Object.keys(dataSummary.correlation_matrix).map((col) => (
                          <th key={col} className="px-2 py-1 text-left text-xs font-medium text-gray-300">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(dataSummary.correlation_matrix).map(([row, values], rowIndex) => (
                        <tr key={row} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                          <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-200">
                            {row}
                          </td>
                          {Object.entries(values).map(([col, value]) => (
                            <td
                              key={`${row}-${col}`}
                              className="px-2 py-1 whitespace-nowrap text-xs"
                              style={{
                                backgroundColor: value > 0 
                                  ? `rgba(59, 130, 246, ${Math.abs(value) * 0.5})` 
                                  : value < 0 
                                  ? `rgba(239, 68, 68, ${Math.abs(value) * 0.5})` 
                                  : 'transparent',
                                color: Math.abs(value) > 0.7 ? 'white' : '#e5e7eb'
                              }}
                            >
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 