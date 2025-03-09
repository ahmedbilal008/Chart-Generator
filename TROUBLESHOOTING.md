# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to fetch" Error

This error typically appears when the backend server is not running or not accessible.

**Solutions:**

1. **Start both servers together:**
   ```bash
   npm run start:all
   ```

2. **Start servers separately:**
   - Start the backend:
     ```bash
     cd backend
     python run.py
     ```
   - Start the frontend (in a different terminal):
     ```bash
     npm run dev
     ```

3. **Check if Python is installed:**
   ```bash
   python --version
   ```
   If not installed, download and install Python from [python.org](https://www.python.org/downloads/).

4. **Check backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### 2. Python Dependency Issues

If you're using Python 3.12, you might encounter compatibility issues with some packages.

**Solutions:**

1. **Use Python 3.10 or 3.11 instead** (recommended)

2. **Update requirements.txt** to use compatible versions:
   ```
   fastapi>=0.104.1
   uvicorn>=0.24.0
   pandas>=2.1.1
   numpy>=1.26.0
   scikit-learn>=1.3.2
   python-multipart>=0.0.6
   pydantic>=2.5.0
   matplotlib>=3.8.0
   seaborn>=0.13.0
   joblib>=1.3.2
   ```

3. **Create a virtual environment** with a specific Python version:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

### 3. Gemini API Key Issues

If you see a warning about the Gemini API key not being set:

**Solutions:**

1. **Get an API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **Add the key to .env.local**:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Restart the application** after adding the API key

### 4. CORS Issues

If you're experiencing CORS errors in the browser console:

**Solutions:**

1. **Ensure the backend CORS settings are correct** in `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
       expose_headers=["*"]
   )
   ```

2. **Check that the API URL is correct** in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### 5. Port Conflicts

If you see errors about ports already being in use:

**Solutions:**

1. **Find and terminate the process** using the port:
   - On Windows:
     ```
     netstat -ano | findstr :8000
     taskkill /PID <PID> /F
     ```
   - On macOS/Linux:
     ```
     lsof -i :8000
     kill -9 <PID>
     ```

2. **Change the port** in `backend/app/main.py`:
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8001)
   ```
   And update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

## Still Having Issues?

If you're still experiencing problems:

1. Check the browser console (F12) for error messages
2. Check the terminal for backend error messages
3. Try restarting both the frontend and backend servers
4. Make sure all dependencies are installed correctly 