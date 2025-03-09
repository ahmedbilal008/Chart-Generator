import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from typing import Dict, List, Tuple, Optional, Any, Union
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataProcessor:
    """
    Advanced data processor for handling natural language queries and data analysis.
    """
    
    def __init__(self, data: Union[pd.DataFrame, List[Dict[str, Any]]]):
        """Initialize with either a DataFrame or list of dictionaries."""
        if isinstance(data, pd.DataFrame):
            self.df = data
        else:
            self.df = pd.DataFrame(data)
        
        # Analyze data types
        self._analyze_data_types()
        
    def _analyze_data_types(self):
        """Analyze and store information about data types."""
        self.numeric_cols = self.df.select_dtypes(include=['number']).columns.tolist()
        self.categorical_cols = self.df.select_dtypes(exclude=['number']).columns.tolist()
        self.datetime_cols = []
        
        # Try to convert string columns to datetime
        for col in self.categorical_cols:
            try:
                pd.to_datetime(self.df[col])
                self.datetime_cols.append(col)
            except:
                pass
    
    def process_query(self, query: str, max_points: int = 50) -> Dict[str, Any]:
        """
        Process a natural language query and return appropriate data and insights.
        
        Args:
            query: The natural language query
            max_points: Maximum number of data points to return
            
        Returns:
            Dictionary with processed data, insights, and visualization suggestions
        """
        # Default response structure
        response = {
            "processed_data": [],
            "insights": [],
            "suggested_visualization": None,
            "charts": []
        }
        
        # Check if DataFrame is empty
        if self.df.empty:
            response["insights"].append("The dataset is empty.")
            return response
        
        # Extract key information from the query
        query_info = self._analyze_query(query)
        
        # Reduce data points if needed
        if len(self.df) > max_points:
            df_reduced = self._reduce_data(max_points, query_info)
            response["insights"].append(f"Dataset reduced from {len(self.df)} to {len(df_reduced)} points for visualization.")
        else:
            df_reduced = self.df
        
        # Process data based on query type
        if query_info["query_type"] == "aggregation":
            result = self._handle_aggregation_query(query_info)
            response["processed_data"] = result.to_dict(orient='records')
            response["suggested_visualization"] = query_info["chart_type"]
            
        elif query_info["query_type"] == "filtering":
            result = self._handle_filtering_query(query_info)
            # If still too many points after filtering, reduce
            if len(result) > max_points:
                result = self._reduce_data(max_points, query_info, df=result)
            response["processed_data"] = result.to_dict(orient='records')
            response["suggested_visualization"] = query_info["chart_type"]
            
        elif query_info["query_type"] == "correlation":
            result, insights = self._handle_correlation_query(query_info)
            response["processed_data"] = result.to_dict(orient='records')
            response["insights"].extend(insights)
            response["suggested_visualization"] = "ScatterChart"
            
        elif query_info["query_type"] == "trend":
            result, insights = self._handle_trend_query(query_info)
            response["processed_data"] = result.to_dict(orient='records')
            response["insights"].extend(insights)
            response["suggested_visualization"] = "LineChart"
            
        else:  # Default case
            response["processed_data"] = df_reduced.to_dict(orient='records')
            response["suggested_visualization"] = query_info["chart_type"]
        
        # Add general insights about the data
        general_insights = self._generate_general_insights()
        response["insights"].extend(general_insights)
        
        # Generate additional charts if appropriate
        additional_charts = self._generate_additional_charts(query_info)
        if additional_charts:
            response["charts"] = additional_charts
        
        return response
    
    def _analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze the natural language query to determine the type of analysis needed.
        
        Returns a dictionary with query information.
        """
        query = query.lower()
        
        # Default query info
        query_info = {
            "query_type": "general",
            "chart_type": "BarChart",
            "target_columns": [],
            "aggregation": None,
            "filter_condition": None,
            "group_by": None,
            "limit": None
        }
        
        # Determine query type
        if any(term in query for term in ["average", "mean", "sum", "total", "count", "aggregate", "group by"]):
            query_info["query_type"] = "aggregation"
        elif any(term in query for term in ["correlation", "relationship", "versus", "vs", "against", "compare"]):
            query_info["query_type"] = "correlation"
        elif any(term in query for term in ["filter", "where", "only", "exclude"]):
            query_info["query_type"] = "filtering"
        elif any(term in query for term in ["trend", "over time", "timeseries", "time series", "growth"]):
            query_info["query_type"] = "trend"
        
        # Determine chart type
        if any(term in query for term in ["bar chart", "bar graph", "column chart"]):
            query_info["chart_type"] = "BarChart"
        elif any(term in query for term in ["line chart", "line graph", "trend"]):
            query_info["chart_type"] = "LineChart"
        elif any(term in query for term in ["pie chart", "pie graph", "distribution"]):
            query_info["chart_type"] = "PieChart"
        elif any(term in query for term in ["scatter", "scatter plot", "correlation"]):
            query_info["chart_type"] = "ScatterChart"
        elif any(term in query for term in ["area chart", "area graph"]):
            query_info["chart_type"] = "AreaChart"
        
        # Try to identify target columns
        for col in self.df.columns:
            if col.lower() in query:
                query_info["target_columns"].append(col)
        
        # If no columns found, use heuristics
        if not query_info["target_columns"]:
            if query_info["query_type"] == "correlation" and len(self.numeric_cols) >= 2:
                query_info["target_columns"] = self.numeric_cols[:2]
            elif query_info["chart_type"] == "PieChart" and self.categorical_cols:
                query_info["target_columns"] = [self.categorical_cols[0]]
                if self.numeric_cols:
                    query_info["target_columns"].append(self.numeric_cols[0])
            elif self.numeric_cols:
                query_info["target_columns"] = [self.numeric_cols[0]]
                if self.categorical_cols:
                    query_info["target_columns"].append(self.categorical_cols[0])
        
        # Determine aggregation function
        if "average" in query or "mean" in query:
            query_info["aggregation"] = "mean"
        elif "sum" in query or "total" in query:
            query_info["aggregation"] = "sum"
        elif "count" in query:
            query_info["aggregation"] = "count"
        elif "maximum" in query or "max" in query:
            query_info["aggregation"] = "max"
        elif "minimum" in query or "min" in query:
            query_info["aggregation"] = "min"
        
        # Try to identify group by columns
        if "group by" in query:
            for col in self.categorical_cols:
                if col.lower() in query:
                    query_info["group_by"] = col
                    break
        
        # If no explicit group by but we need one, use the first categorical column
        if query_info["query_type"] == "aggregation" and not query_info["group_by"] and self.categorical_cols:
            query_info["group_by"] = self.categorical_cols[0]
        
        return query_info
    
    def _reduce_data(self, max_points: int, query_info: Dict[str, Any], df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Intelligently reduce data points while preserving patterns.
        
        Args:
            max_points: Maximum number of data points
            query_info: Query information dictionary
            df: Optional DataFrame to use instead of self.df
            
        Returns:
            Reduced DataFrame
        """
        if df is None:
            df = self.df
            
        # If we have a time series query, preserve time patterns
        if query_info["query_type"] == "trend" and self.datetime_cols:
            return self._reduce_timeseries(df, max_points, query_info)
            
        # If we have numeric columns, use clustering
        elif len(self.numeric_cols) >= 2:
            return self._reduce_with_clustering(df, max_points)
            
        # Otherwise use simple sampling
        else:
            return df.sample(min(max_points, len(df)))
    
    def _reduce_timeseries(self, df: pd.DataFrame, max_points: int, query_info: Dict[str, Any]) -> pd.DataFrame:
        """Reduce time series data while preserving trends."""
        time_col = self.datetime_cols[0]
        
        # Convert to datetime if not already
        df = df.copy()
        df[time_col] = pd.to_datetime(df[time_col])
        
        # Sort by time
        df = df.sort_values(by=time_col)
        
        # If we have a group by column, use it
        if query_info["group_by"]:
            # Group by time and the group by column
            group_cols = [pd.Grouper(key=time_col, freq='D'), query_info["group_by"]]
            
            # If we have a target column for aggregation, use it
            if query_info["target_columns"] and query_info["aggregation"]:
                target_col = query_info["target_columns"][0]
                agg_func = query_info["aggregation"]
                
                # Aggregate
                result = df.groupby(group_cols)[target_col].agg(agg_func).reset_index()
                
                # If still too many points, increase the frequency
                if len(result) > max_points:
                    # Try weekly
                    group_cols[0] = pd.Grouper(key=time_col, freq='W')
                    result = df.groupby(group_cols)[target_col].agg(agg_func).reset_index()
                    
                    # If still too many, try monthly
                    if len(result) > max_points:
                        group_cols[0] = pd.Grouper(key=time_col, freq='M')
                        result = df.groupby(group_cols)[target_col].agg(agg_func).reset_index()
                
                return result
            
            # If no target column, just count
            else:
                result = df.groupby(group_cols).size().reset_index(name='count')
                
                # If still too many points, increase the frequency
                if len(result) > max_points:
                    # Try weekly
                    group_cols[0] = pd.Grouper(key=time_col, freq='W')
                    result = df.groupby(group_cols).size().reset_index(name='count')
                    
                    # If still too many, try monthly
                    if len(result) > max_points:
                        group_cols[0] = pd.Grouper(key=time_col, freq='M')
                        result = df.groupby(group_cols).size().reset_index(name='count')
                
                return result
        
        # If no group by, just resample the time series
        else:
            # Set the time column as index
            df = df.set_index(time_col)
            
            # If we have a target column for aggregation, use it
            if query_info["target_columns"] and query_info["aggregation"]:
                target_col = query_info["target_columns"][0]
                agg_func = query_info["aggregation"]
                
                # Resample
                result = df[target_col].resample('D').agg(agg_func).reset_index()
                
                # If still too many points, increase the frequency
                if len(result) > max_points:
                    # Try weekly
                    result = df[target_col].resample('W').agg(agg_func).reset_index()
                    
                    # If still too many, try monthly
                    if len(result) > max_points:
                        result = df[target_col].resample('M').agg(agg_func).reset_index()
                
                return result
            
            # If no target column, just count
            else:
                result = df.resample('D').size().reset_index(name='count')
                
                # If still too many points, increase the frequency
                if len(result) > max_points:
                    # Try weekly
                    result = df.resample('W').size().reset_index(name='count')
                    
                    # If still too many, try monthly
                    if len(result) > max_points:
                        result = df.resample('M').size().reset_index(name='count')
                
                return result
    
    def _reduce_with_clustering(self, df: pd.DataFrame, max_points: int) -> pd.DataFrame:
        """Reduce data using clustering techniques."""
        # Extract numeric data for clustering
        numeric_data = df[self.numeric_cols].copy()
        
        # Handle missing values
        numeric_data = numeric_data.fillna(numeric_data.mean())
        
        # Standardize the data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_data)
        
        # Determine optimal number of clusters (up to max_points)
        n_clusters = min(max_points, len(df))
        
        # If we have many data points, try to find optimal number of clusters
        if len(df) > 1000 and n_clusters > 10:
            # Sample data for faster computation
            sample_indices = np.random.choice(len(scaled_data), min(1000, len(scaled_data)), replace=False)
            sample_data = scaled_data[sample_indices]
            
            # Try different numbers of clusters
            silhouette_scores = []
            cluster_range = range(5, min(50, n_clusters), 5)
            
            for n in cluster_range:
                kmeans = KMeans(n_clusters=n, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(sample_data)
                
                # Skip if only one cluster
                if len(np.unique(cluster_labels)) <= 1:
                    silhouette_scores.append(0)
                    continue
                
                silhouette_avg = silhouette_score(sample_data, cluster_labels)
                silhouette_scores.append(silhouette_avg)
            
            # Find the best number of clusters
            if silhouette_scores:
                best_n_clusters = cluster_range[np.argmax(silhouette_scores)]
                n_clusters = min(best_n_clusters, n_clusters)
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(scaled_data)
        
        # Get cluster centers and convert back to original scale
        centers = scaler.inverse_transform(kmeans.cluster_centers_)
        
        # Create a DataFrame with cluster centers
        centers_df = pd.DataFrame(centers, columns=self.numeric_cols)
        
        # Add categorical columns (using mode of each cluster)
        for col in df.columns:
            if col not in self.numeric_cols:
                # For each cluster, find the most common value
                modes = []
                for i in range(len(centers_df)):
                    cluster_values = df.loc[clusters == i, col]
                    mode_value = cluster_values.mode()[0] if not cluster_values.empty else None
                    modes.append(mode_value)
                centers_df[col] = modes
        
        return centers_df
    
    def _handle_aggregation_query(self, query_info: Dict[str, Any]) -> pd.DataFrame:
        """Handle aggregation queries (sum, average, count, etc.)."""
        # Default to count if no aggregation specified
        agg_func = query_info["aggregation"] or "count"
        
        # If we have a group by column
        if query_info["group_by"]:
            group_col = query_info["group_by"]
            
            # If we have target columns
            if query_info["target_columns"]:
                target_col = query_info["target_columns"][0]
                
                # Group by and aggregate
                result = self.df.groupby(group_col)[target_col].agg(agg_func).reset_index()
                result.columns = [group_col, f"{agg_func}_{target_col}"]
                
                # Sort by the aggregated value
                result = result.sort_values(by=f"{agg_func}_{target_col}", ascending=False)
                
                # Limit if specified
                if query_info["limit"]:
                    result = result.head(query_info["limit"])
                
                return result
            
            # If no target columns, just count
            else:
                result = self.df.groupby(group_col).size().reset_index(name='count')
                
                # Sort by count
                result = result.sort_values(by='count', ascending=False)
                
                # Limit if specified
                if query_info["limit"]:
                    result = result.head(query_info["limit"])
                
                return result
        
        # If no group by, aggregate the entire dataset
        else:
            # If we have target columns
            if query_info["target_columns"]:
                target_col = query_info["target_columns"][0]
                
                # Aggregate
                agg_value = getattr(self.df[target_col], agg_func)()
                
                # Create a single row DataFrame
                result = pd.DataFrame({
                    'metric': [f"{agg_func}_{target_col}"],
                    'value': [agg_value]
                })
                
                return result
            
            # If no target columns, just count rows
            else:
                result = pd.DataFrame({
                    'metric': ['count'],
                    'value': [len(self.df)]
                })
                
                return result
    
    def _handle_filtering_query(self, query_info: Dict[str, Any]) -> pd.DataFrame:
        """Handle filtering queries."""
        # Start with the full DataFrame
        filtered_df = self.df.copy()
        
        # Apply filter condition if specified
        if query_info["filter_condition"]:
            # This would require more complex NLP to extract filter conditions
            # For now, we'll just return the full DataFrame
            pass
        
        # If we have target columns, select only those
        if query_info["target_columns"]:
            # Make sure all target columns exist
            valid_cols = [col for col in query_info["target_columns"] if col in filtered_df.columns]
            
            if valid_cols:
                filtered_df = filtered_df[valid_cols]
        
        # Limit if specified
        if query_info["limit"]:
            filtered_df = filtered_df.head(query_info["limit"])
        
        return filtered_df
    
    def _handle_correlation_query(self, query_info: Dict[str, Any]) -> Tuple[pd.DataFrame, List[str]]:
        """Handle correlation queries."""
        insights = []
        
        # If we have at least two numeric columns
        if len(self.numeric_cols) >= 2:
            # If target columns are specified and both are numeric
            if len(query_info["target_columns"]) >= 2 and all(col in self.numeric_cols for col in query_info["target_columns"][:2]):
                col1, col2 = query_info["target_columns"][:2]
            else:
                # Use the first two numeric columns
                col1, col2 = self.numeric_cols[:2]
            
            # Calculate correlation
            correlation = self.df[col1].corr(self.df[col2])
            
            # Add insight about correlation
            if abs(correlation) > 0.7:
                strength = "strong"
            elif abs(correlation) > 0.3:
                strength = "moderate"
            else:
                strength = "weak"
                
            direction = "positive" if correlation > 0 else "negative"
            
            insights.append(f"There is a {strength} {direction} correlation ({correlation:.2f}) between {col1} and {col2}.")
            
            # Create a DataFrame with just these two columns
            result = self.df[[col1, col2]].copy()
            
            # If we have a categorical column, add it for coloring
            if self.categorical_cols:
                result[self.categorical_cols[0]] = self.df[self.categorical_cols[0]]
            
            return result, insights
        
        # If we don't have enough numeric columns
        else:
            insights.append("Not enough numeric columns for correlation analysis.")
            return self.df.head(100), insights
    
    def _handle_trend_query(self, query_info: Dict[str, Any]) -> Tuple[pd.DataFrame, List[str]]:
        """Handle trend queries."""
        insights = []
        
        # If we have datetime columns
        if self.datetime_cols:
            time_col = self.datetime_cols[0]
            
            # Convert to datetime if not already
            df = self.df.copy()
            df[time_col] = pd.to_datetime(df[time_col])
            
            # Sort by time
            df = df.sort_values(by=time_col)
            
            # If we have a target column
            if query_info["target_columns"]:
                target_col = query_info["target_columns"][0]
                
                # If the target column is numeric
                if target_col in self.numeric_cols:
                    # Resample by day and aggregate
                    agg_func = query_info["aggregation"] or "mean"
                    df = df.set_index(time_col)
                    result = df[target_col].resample('D').agg(agg_func).reset_index()
                    result.columns = [time_col, f"{agg_func}_{target_col}"]
                    
                    # Calculate trend
                    values = result[f"{agg_func}_{target_col}"].values
                    if len(values) > 1:
                        start_val = values[0]
                        end_val = values[-1]
                        pct_change = ((end_val - start_val) / start_val) * 100 if start_val != 0 else 0
                        
                        if pct_change > 0:
                            insights.append(f"{target_col} has increased by {pct_change:.1f}% over the time period.")
                        else:
                            insights.append(f"{target_col} has decreased by {abs(pct_change):.1f}% over the time period.")
                    
                    return result, insights
                
                # If the target column is categorical
                else:
                    # Count occurrences by day
                    df = df.set_index(time_col)
                    result = df[target_col].resample('D').count().reset_index()
                    result.columns = [time_col, f"count_{target_col}"]
                    
                    return result, insights
            
            # If no target column, just count rows by day
            else:
                df = df.set_index(time_col)
                result = df.resample('D').size().reset_index(name='count')
                
                return result, insights
        
        # If we don't have datetime columns
        else:
            insights.append("No datetime columns found for trend analysis.")
            return self.df.head(100), insights
    
    def _generate_general_insights(self) -> List[str]:
        """Generate general insights about the data."""
        insights = []
        
        # Basic dataset info
        insights.append(f"Dataset has {len(self.df)} rows and {len(self.df.columns)} columns.")
        
        # Missing values
        missing_values = self.df.isnull().sum().sum()
        if missing_values > 0:
            missing_pct = (missing_values / (len(self.df) * len(self.df.columns))) * 100
            insights.append(f"Dataset contains {missing_values} missing values ({missing_pct:.1f}% of all cells).")
        
        # Numeric column insights
        if self.numeric_cols:
            # Find column with highest variance
            variances = self.df[self.numeric_cols].var()
            highest_var_col = variances.idxmax()
            insights.append(f"{highest_var_col} has the highest variance among numeric columns.")
            
            # Find outliers in numeric columns
            for col in self.numeric_cols[:2]:  # Limit to first 2 columns
                q1 = self.df[col].quantile(0.25)
                q3 = self.df[col].quantile(0.75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                outliers = ((self.df[col] < lower_bound) | (self.df[col] > upper_bound)).sum()
                
                if outliers > 0:
                    outlier_pct = (outliers / len(self.df)) * 100
                    if outlier_pct > 5:
                        insights.append(f"{col} contains {outliers} outliers ({outlier_pct:.1f}% of values).")
        
        # Categorical column insights
        if self.categorical_cols:
            # Find column with most unique values
            unique_counts = {col: self.df[col].nunique() for col in self.categorical_cols}
            most_unique_col = max(unique_counts.items(), key=lambda x: x[1])[0]
            insights.append(f"{most_unique_col} has the most unique values ({unique_counts[most_unique_col]}) among categorical columns.")
        
        return insights
    
    def _generate_additional_charts(self, query_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate additional charts that might be useful for the query."""
        charts = []
        
        # If we have numeric columns, add a correlation heatmap
        if len(self.numeric_cols) > 1:
            corr_matrix = self.df[self.numeric_cols].corr()
            
            # Convert to list of records for frontend
            corr_data = []
            for i, col1 in enumerate(corr_matrix.columns):
                for j, col2 in enumerate(corr_matrix.columns):
                    corr_data.append({
                        "column1": col1,
                        "column2": col2,
                        "correlation": corr_matrix.iloc[i, j]
                    })
            
            charts.append({
                "type": "HeatmapChart",
                "title": "Correlation Heatmap",
                "data": corr_data
            })
        
        # If we have categorical columns, add a bar chart of counts
        if self.categorical_cols:
            cat_col = self.categorical_cols[0]
            value_counts = self.df[cat_col].value_counts().reset_index()
            value_counts.columns = [cat_col, 'count']
            
            # Limit to top 10
            value_counts = value_counts.head(10)
            
            charts.append({
                "type": "BarChart",
                "title": f"Top 10 {cat_col} by Count",
                "data": value_counts.to_dict(orient='records')
            })
        
        # If we have datetime columns, add a line chart of counts over time
        if self.datetime_cols:
            time_col = self.datetime_cols[0]
            
            # Convert to datetime if not already
            df = self.df.copy()
            df[time_col] = pd.to_datetime(df[time_col])
            
            # Group by month
            df = df.set_index(time_col)
            counts_by_time = df.resample('M').size().reset_index(name='count')
            
            charts.append({
                "type": "LineChart",
                "title": "Counts Over Time",
                "data": counts_by_time.to_dict(orient='records')
            })
        
        return charts 