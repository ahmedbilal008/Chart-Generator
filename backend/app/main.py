from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import json
from typing import Dict, List, Optional, Any
import io
import logging
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom JSON encoder to handle NaN values
class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            # Replace NaN with None (null in JSON)
            return None if np.isnan(obj) else float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.Series):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)

# Custom JSONResponse that uses our encoder
class CustomJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            cls=NpEncoder,
        ).encode("utf-8")

app = FastAPI(title="Data Processing API for Query Playground")

# Add CORS middleware with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class DataAnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    query: str
    max_points: Optional[int] = 50

class ColumnInfo(BaseModel):
    name: str
    type: str
    unique_values: int
    sample_values: List[Any]
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    median_value: Optional[float] = None

class DataSummary(BaseModel):
    row_count: int
    column_count: int
    columns: List[ColumnInfo]
    correlation_matrix: Optional[Dict[str, Dict[str, float]]] = None

@app.get("/")
async def root():
    return {"message": "Data Processing API for Natural Language Query Playground"}

@app.post("/process-data/")
async def process_data(request: DataAnalysisRequest):
    try:
        # Convert list of dictionaries to DataFrame
        df = pd.DataFrame(request.data)
        
        # Process the query and data
        result = process_query(df, request.query, request.max_points)
        
        # Return with custom JSON response to handle NaN values
        return CustomJSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Replace NaN values with None for JSON serialization
        df = df.replace({np.nan: None})
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict(orient='records')
        
        # Get data summary
        summary = get_data_summary(df)
        
        # Return with custom JSON response
        return CustomJSONResponse(content={
            "data": data,
            "summary": summary
        })
    except Exception as e:
        logger.error(f"Error uploading CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-json/")
async def upload_json(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        data = json.loads(contents.decode('utf-8'))
        
        # Convert to DataFrame for processing
        df = pd.DataFrame(data)
        
        # Replace NaN values with None for JSON serialization
        df = df.replace({np.nan: None})
        
        # Get data summary
        summary = get_data_summary(df)
        
        # Return with custom JSON response
        return CustomJSONResponse(content={
            "data": df.to_dict(orient='records'),
            "summary": summary
        })
    except Exception as e:
        logger.error(f"Error uploading JSON: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-data/")
async def analyze_data(data: List[Dict[str, Any]] = Body(...)):
    try:
        df = pd.DataFrame(data)
        
        # Replace NaN values with None for JSON serialization
        df = df.replace({np.nan: None})
        
        summary = get_data_summary(df)
        return CustomJSONResponse(content=summary)
    except Exception as e:
        logger.error(f"Error analyzing data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def get_data_summary(df: pd.DataFrame) -> Dict:
    """Generate a comprehensive summary of the DataFrame."""
    
    # Basic info
    row_count = len(df)
    column_count = len(df.columns)
    
    # Column information
    columns = []
    for col in df.columns:
        col_info = {
            "name": col,
            "type": str(df[col].dtype),
            "unique_values": df[col].nunique(),
            "sample_values": df[col].dropna().sample(min(5, len(df))).tolist() if not df[col].empty else []
        }
        
        # Add numerical statistics if applicable
        if pd.api.types.is_numeric_dtype(df[col]):
            col_info.update({
                "min_value": float(df[col].min()) if not df[col].empty and not pd.isna(df[col].min()) else None,
                "max_value": float(df[col].max()) if not df[col].empty and not pd.isna(df[col].max()) else None,
                "mean_value": float(df[col].mean()) if not df[col].empty and not pd.isna(df[col].mean()) else None,
                "median_value": float(df[col].median()) if not df[col].empty and not pd.isna(df[col].median()) else None
            })
        
        columns.append(col_info)
    
    # Calculate correlation matrix for numerical columns
    correlation_matrix = None
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 1:
        corr_df = df[numeric_cols].corr()
        # Replace NaN values with None for JSON serialization
        corr_df = corr_df.fillna(0)  # Replace NaN with 0 in correlation matrix
        correlation_matrix = corr_df.to_dict(orient='dict')
    
    return {
        "row_count": row_count,
        "column_count": column_count,
        "columns": columns,
        "correlation_matrix": correlation_matrix
    }

def process_query(df: pd.DataFrame, query: str, max_points: int = 50) -> Dict:
    """Process the natural language query and return appropriate data."""
    
    # Default response structure
    response = {
        "processed_data": [],
        "insights": [],
        "suggested_visualization": None
    }
    
    # Check if DataFrame is empty
    if df.empty:
        response["insights"].append("The dataset is empty.")
        return response
    
    # Determine numeric and categorical columns
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=['number']).columns.tolist()
    
    # Basic data reduction - if too many points, use clustering or sampling
    if len(df) > max_points:
        response["insights"].append(f"Dataset reduced from {len(df)} to {max_points} points for visualization.")
        
        # If we have numeric columns, use K-means clustering
        if len(numeric_cols) >= 2:
            df_reduced = reduce_data_kmeans(df, max_points, numeric_cols)
            response["insights"].append("K-means clustering was used to reduce data points while preserving patterns.")
        else:
            # Simple random sampling if not enough numeric columns
            df_reduced = df.sample(max_points)
            response["insights"].append("Random sampling was used to reduce data points.")
    else:
        df_reduced = df
    
    # Replace NaN values with None for JSON serialization
    df_reduced = df_reduced.replace({np.nan: None})
    
    # Convert the reduced DataFrame to records
    response["processed_data"] = df_reduced.to_dict(orient='records')
    
    # Add basic insights about the data
    if numeric_cols:
        for col in numeric_cols[:3]:  # Limit to first 3 columns to avoid overwhelming
            if not pd.isna(df[col].min()) and not pd.isna(df[col].max()) and not pd.isna(df[col].mean()):
                response["insights"].append(f"{col}: Min={df[col].min():.2f}, Max={df[col].max():.2f}, Mean={df[col].mean():.2f}")
    
    # Suggest visualization based on data types
    if len(numeric_cols) >= 2:
        response["suggested_visualization"] = "ScatterChart"
    elif len(numeric_cols) == 1 and len(categorical_cols) >= 1:
        response["suggested_visualization"] = "BarChart"
    elif len(categorical_cols) >= 1:
        response["suggested_visualization"] = "PieChart"
    else:
        response["suggested_visualization"] = "TableView"
    
    return response

def reduce_data_kmeans(df: pd.DataFrame, n_clusters: int, numeric_cols: List[str]) -> pd.DataFrame:
    """Reduce data using K-means clustering."""
    
    # Extract numeric data for clustering
    numeric_data = df[numeric_cols].copy()
    
    # Handle missing values
    numeric_data = numeric_data.fillna(numeric_data.mean())
    
    # Standardize the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_data)
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=min(n_clusters, len(df)), random_state=42, n_init=10)
    clusters = kmeans.fit_predict(scaled_data)
    
    # Get cluster centers and convert back to original scale
    centers = scaler.inverse_transform(kmeans.cluster_centers_)
    
    # Create a DataFrame with cluster centers
    centers_df = pd.DataFrame(centers, columns=numeric_cols)
    
    # Add categorical columns (using mode of each cluster)
    for col in df.columns:
        if col not in numeric_cols:
            # For each cluster, find the most common value
            modes = []
            for i in range(len(centers_df)):
                cluster_values = df.loc[clusters == i, col]
                mode_value = cluster_values.mode()[0] if not cluster_values.empty else None
                modes.append(mode_value)
            centers_df[col] = modes
    
    return centers_df

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 