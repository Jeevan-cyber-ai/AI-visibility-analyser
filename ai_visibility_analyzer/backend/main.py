"""
FastAPI Main Application Entry Point.
Connects controllers, handles middleware, serves static files & web dashboard.

To run:
    python -m uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config.settings import settings
from controllers.audit_controller import router as audit_router
from controllers.content_controller import router as content_router

current_dir = Path(__file__).resolve().parent
static_dir = current_dir / "static"
sample_v1_dir = current_dir / "sample_site" / "v1_baseline"
sample_v2_dir = current_dir / "sample_site" / "v2_optimized"

app = FastAPI(
    title="AI Visibility & GEO Analyzer API",
    version="1.0.0",
    description="Engine for measuring AI mentions, citation sources, and Generative Engine Optimization.",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Controller Routers (C in MVC)
app.include_router(audit_router)
app.include_router(content_router)

# Mount Sample Websites for live browsing
if sample_v1_dir.exists():
    app.mount("/sample/v1", StaticFiles(directory=str(sample_v1_dir), html=True), name="sample_v1")

if sample_v2_dir.exists():
    app.mount("/sample/v2", StaticFiles(directory=str(sample_v2_dir), html=True), name="sample_v2")

frontend_dist = current_dir.parent / "frontend" / "dist"

# Mount Frontend Vite Dist Assets
if frontend_dist.exists() and (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="dist_assets")

# Mount Static Assets / Dashboard
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", tags=["dashboard"])
def serve_dashboard():
    """Serves the interactive executive web dashboard."""
    # Prioritize the fully-fledged modern Vite + React SPA build
    if frontend_dist.exists() and (frontend_dist / "index.html").exists():
        return FileResponse(str(frontend_dist / "index.html"))
    
    # Fallback to backend static file
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "AI Visibility & GEO Analyzer API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health", tags=["system"])
def health_check():
    """Returns API health status and available LLM keys."""
    return {
        "status": "healthy",
        "providers": settings.get_available_providers(),
        "has_live_key": settings.has_any_key(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
