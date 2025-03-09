/**
 * API service for communicating with the Python backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Upload a CSV file to the backend
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - The processed data and summary
 */
export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log(`Uploading CSV to ${API_BASE_URL}/upload-csv/`);
    const response = await fetch(`${API_BASE_URL}/upload-csv/`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to upload CSV: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading CSV:', error);
    throw error;
  }
}

/**
 * Upload a JSON file to the backend
 * @param {File} file - The JSON file to upload
 * @returns {Promise<Object>} - The processed data and summary
 */
export async function uploadJSON(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log(`Uploading JSON to ${API_BASE_URL}/upload-json/`);
    const response = await fetch(`${API_BASE_URL}/upload-json/`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to upload JSON: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading JSON:', error);
    throw error;
  }
}

/**
 * Process data with a natural language query
 * @param {Array} data - The data to process
 * @param {string} query - The natural language query
 * @param {number} maxPoints - Maximum number of data points to return
 * @returns {Promise<Object>} - The processed data and insights
 */
export async function processQuery(data, query, maxPoints = 50) {
  try {
    console.log(`Processing query at ${API_BASE_URL}/process-data/`);
    const response = await fetch(`${API_BASE_URL}/process-data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        query,
        max_points: maxPoints,
      }),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to process query: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}

/**
 * Analyze data to get insights
 * @param {Array} data - The data to analyze
 * @returns {Promise<Object>} - The data summary and insights
 */
export async function analyzeData(data) {
  try {
    console.log(`Analyzing data at ${API_BASE_URL}/analyze-data/`);
    const response = await fetch(`${API_BASE_URL}/analyze-data/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to analyze data: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw error;
  }
}

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>} - True if the server is running
 */
export async function checkServerStatus() {
  try {
    console.log(`Checking server status at ${API_BASE_URL}`);
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Server check failed:', error);
    return false;
  }
} 