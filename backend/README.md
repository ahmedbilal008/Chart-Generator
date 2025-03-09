# Natural Language Query Playground - Python Backend

This is the Python backend for the Natural Language Query Playground application. It provides data processing, analysis, and insights generation capabilities to support the frontend visualization.

## Features

- Data upload and processing (CSV, JSON)
- Natural language query interpretation
- Intelligent data reduction using ML techniques (K-means clustering)
- Time series analysis and trend detection
- Correlation analysis
- Automatic insights generation
- Data visualization suggestions

## Setup

1. Install Python 3.8+ if not already installed

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   python run.py
   ```

The server will start at http://localhost:8000

## API Endpoints

- `GET /` - Health check
- `POST /upload-csv/` - Upload and process CSV data
- `POST /upload-json/` - Upload and process JSON data
- `POST /process-data/` - Process data with a natural language query
- `POST /analyze-data/` - Generate insights about uploaded data

## Example Usage

### Process Data with Query

```bash
curl -X POST "http://localhost:8000/process-data/" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"category": "A", "value": 10}, {"category": "B", "value": 20}],
    "query": "Show a bar chart of values by category",
    "max_points": 50
  }'
```

## Integration with Frontend

The backend is designed to work with the Next.js frontend. The frontend makes API calls to this backend to process data and generate visualizations based on natural language queries. 