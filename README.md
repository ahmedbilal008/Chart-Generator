# Natural Language Query Playground

A powerful web application that allows users to query and visualize data using natural language. The system combines a Python backend for advanced data processing and a Next.js frontend with Gemini API for visualization.

![Natural Language Query Playground](https://i.imgur.com/placeholder.png)

## Features

- **Natural Language Queries**: Ask questions about your data in plain English
- **Advanced Data Processing**: Python backend with ML techniques for data reduction and analysis
- **Intelligent Visualization**: Gemini API generates appropriate visualizations based on queries
- **Data Insights**: Automatic generation of insights about your data
- **Multiple Chart Types**: Support for Bar, Line, Pie, Scatter, Area, and Heatmap charts
- **Interactive Code Editing**: View and modify the generated chart code

## Architecture

The application consists of two main components:

1. **Python Backend (FastAPI)**
   - Data processing and analysis
   - ML-based data reduction (K-means clustering)
   - Time series analysis
   - Correlation detection
   - Automatic insights generation

2. **Next.js Frontend**
   - User interface for data upload and querying
   - Integration with Gemini API for code generation
   - Dynamic chart rendering with Recharts
   - Interactive code editing

## Setup

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Quick Start

The easiest way to run both the frontend and backend together:

1. Install dependencies:
   ```bash
   npm install
   cd backend && pip install -r requirements.txt && cd ..
   ```

2. Create a `.env.local` file with your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run both servers with a single command:
   ```bash
   npm run start:all
   ```

The application will be available at http://localhost:3000

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python run.py
   ```

The backend server will start at http://localhost:8000

#### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3000

## Usage

1. **Upload Data**: Upload a CSV or JSON file, or use the sample data
2. **Ask a Question**: Enter a natural language query about your data
3. **View Visualization**: See the generated chart based on your query
4. **Explore Insights**: View automatically generated insights about your data
5. **Edit Code**: Modify the generated chart code if needed

## Example Queries

- "Show a bar chart of sales by category"
- "Create a pie chart of expenses by department"
- "Visualize the trend of revenue over time"
- "Compare profit across different regions"
- "Show the correlation between sales and marketing spend"

## How It Works

1. **Data Processing**: The Python backend uses pandas and scikit-learn to process and analyze the data
2. **Query Analysis**: The backend interprets the natural language query to determine the appropriate data transformation
3. **Data Reduction**: For large datasets, the backend uses K-means clustering to reduce the number of data points while preserving patterns
4. **Insight Generation**: The backend automatically generates insights about the data
5. **Code Generation**: The Gemini API generates React/Recharts code based on the processed data and query
6. **Visualization**: The frontend renders the chart using the generated code

## Advanced Features

### Data Reduction Techniques

The backend uses several techniques to reduce large datasets:

- **K-means Clustering**: Groups similar data points together
- **Time Series Resampling**: Aggregates time series data by day, week, or month
- **Random Sampling**: Used when other techniques are not applicable

### Automatic Insights

The system automatically generates insights such as:

- Correlations between variables
- Trends over time
- Outliers and anomalies
- Statistical summaries

## Technologies Used

- **Backend**: Python, FastAPI, Pandas, Scikit-learn
- **Frontend**: Next.js, React, Recharts, react-live
- **AI**: Google Gemini API
