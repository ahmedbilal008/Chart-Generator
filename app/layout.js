import './globals.css';

export const metadata = {
  title: 'Natural Language Query Playground',
  description: 'Generate charts from natural language using Gemini API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
} 