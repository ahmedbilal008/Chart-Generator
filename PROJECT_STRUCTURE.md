# Project Structure

## Overview

The Natural Language Query Playground is organized into two main parts:

1. **Frontend (Next.js)**: Handles the user interface, visualization, and Gemini API integration
2. **Backend (Python/FastAPI)**: Handles data processing, analysis, and insights generation

## Directory Structure

```
natural-language-query-playground/
├── app/                      # Next.js app directory
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout component
│   └── page.js               # Main page component
│
├── backend/                  # Python backend
│   ├── app/                  # FastAPI application
│   │   ├── main.py           # Main FastAPI application
│   │   └── data_processor.py # Advanced data processing module
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Script to run the backend server
│   └── sample_data.csv       # Sample data for testing
│
├── components/               # React components
│   ├── ChartPreview.jsx      # Chart rendering component
│   ├── CodeDisplay.jsx       # Code editor component
│   ├── DataInsights.jsx      # Data insights display component
│   ├── DataUploader.jsx      # File upload component
│   ├── QueryInput.jsx        # Query input component
│   └── QueryPlayground.jsx   # Main application component
│
├── services/                 # Frontend services
│   └── api.js                # API service for backend communication
│
├── public/                   # Static assets
│
├── .env.local                # Environment variables
├── package.json              # Node.js dependencies and scripts
├── run.js                    # Script to run both frontend and backend
└── README.md                 # Project documentation
```

## Key Components

### Frontend

- **QueryPlayground.jsx**: The main component that orchestrates the application flow
- **DataUploader.jsx**: Handles file uploads and communicates with the backend
- **QueryInput.jsx**: Captures natural language queries from the user
- **CodeDisplay.jsx**: Displays and allows editing of generated code
- **ChartPreview.jsx**: Renders the visualization based on the generated code
- **DataInsights.jsx**: Displays insights and data summary from the backend

### Backend

- **main.py**: FastAPI application with endpoints for data processing
- **data_processor.py**: Advanced data processing module with ML techniques

## Data Flow

1. User uploads data via `DataUploader` component
2. Data is sent to the backend for processing and analysis
3. User enters a natural language query via `QueryInput` component
4. Query is sent to the backend for processing
5. Backend returns processed data and insights
6. Frontend sends processed data and query to Gemini API
7. Gemini API generates visualization code
8. Code is displayed in `CodeDisplay` component
9. Visualization is rendered in `ChartPreview` component
10. Insights are displayed in `DataInsights` component 