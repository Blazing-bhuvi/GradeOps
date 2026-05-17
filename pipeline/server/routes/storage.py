"""
server/routes/storage.py — Proxy route for serving binary assets from MongoDB GridFS.
"""

from fastapi import APIRouter, HTTPException, Response
from pipeline.tools.storage import get_storage, MongoStorage

router = APIRouter(prefix="/api/storage", tags=["storage"])

@router.get("/file")
async def serve_file(key: str):
    """
    Fetch binary data from the configured storage backend and serve it to the browser.
    This allows the frontend to view images/PDFs even when stored in a database (GridFS).
    """
    storage = get_storage()
    try:
        data = storage.read(key)
        
        # Determine content type based on extension
        content_type = "application/octet-stream"
        if key.lower().endswith(".png"):
            content_type = "image/png"
        elif key.lower().endswith(".jpg") or key.lower().endswith(".jpeg"):
            content_type = "image/jpeg"
        elif key.lower().endswith(".pdf"):
            content_type = "application/pdf"
            
        return Response(content=data, media_type=content_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
