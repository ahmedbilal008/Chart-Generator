export default function QueryInput({ value, onChange, onSubmit, isLoading, theme }) {
  // Use default theme if not provided
  const defaultTheme = {
    primary: '#4F46E5',
    secondary: '#10B981',
    text: '#1F2937',
    border: '#E5E7EB',
    card: '#FFFFFF',
  };
  
  const t = theme || defaultTheme;
  
  return (
    <div className="space-y-4">
      <textarea
        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2"
        style={{ 
          borderColor: t.border,
          color: t.text,
          backgroundColor: t.card,
          boxShadow: 'none',
        }}
        rows="3"
        placeholder="e.g., 'Show a bar chart of total values by name' or 'Create a pie chart showing the distribution of values'"
        value={value}
        onChange={onChange}
      />
      <button
        className="w-full py-2 px-4 rounded-md text-white font-medium"
        style={{ 
          backgroundColor: isLoading ? '#9CA3AF' : t.primary,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Visualization'}
      </button>
    </div>
  );
} 