"""
What-If Simulation Dashboard - Backend API

FastAPI server for Excel file ingestion and data processing.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import shutil

from excel_parser import parse_excel_file, generate_demo_data

app = FastAPI(
    title="What-If Simulation Dashboard API",
    description="Backend API for capacity planning simulation",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "What-If Simulation Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "/api/health": "Health check",
            "/api/upload": "Upload Excel file (POST)",
            "/api/demo": "Get demo data (GET)"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "API is running"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and parse an Excel (.xlsm) file.
    
    Expects a file with:
    - Sheet "Ref Role Grouping 23" for capacity data
    - Sheet "Consolidated Data" for demand/project data
    
    Returns parsed capacity buckets and project demand data.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.endswith(('.xlsm', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an Excel file (.xlsm, .xlsx, or .xls)"
        )
    
    # Create a temporary file to store the upload
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse the Excel file
        data = parse_excel_file(temp_file_path)
        
        return JSONResponse(content={
            "success": True,
            "data": data,
            "message": f"Successfully parsed {file.filename}"
        })
        
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        # Clean up temporary files
        try:
            shutil.rmtree(temp_dir)
        except:
            pass


@app.get("/api/demo")
async def get_demo_data():
    """
    Get demo data for testing the dashboard without uploading a file.
    
    Returns sample capacity buckets and project demand data.
    """
    try:
        data = generate_demo_data()
        return JSONResponse(content={
            "success": True,
            "data": data,
            "message": "Demo data loaded successfully"
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating demo data: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")

