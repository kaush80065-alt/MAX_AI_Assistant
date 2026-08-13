from pathlib import Path

import psutil
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.ai_engine import get_ai_response
from app.memory import (
    get_profile,
    get_history,
    clear_history,
    update_profile,
)

# =========================================================
# MAX AI Assistant - FastAPI Application
# Version: 1.1
# =========================================================

app = FastAPI(
    title="MAX AI Assistant",
    description="Personal AI assistant with memory, personality, and voice support",
    version="1.1.0"
)

# =========================================================
# Frontend configuration
# =========================================================

# Path to the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Path to backend/frontend
FRONTEND_DIR = BASE_DIR / "frontend"

# =========================================================
# Serve static files (CSS, JS, images)
# =========================================================

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

# =========================================================
# Request model
# =========================================================

class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None

# =========================================================
# Home page
# =========================================================

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")

# =========================================================
# Chat endpoint
# =========================================================

@app.post("/chat")
async def chat(request: ChatRequest):
    reply = await get_ai_response(request.message, request.image)

    return {
        "user": request.message,
        "reply": reply
    }

# =========================================================
# Health check
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "assistant": "MAX",
        "version": "1.1.0"
    }

# =========================================================
# Telemetry endpoint
# =========================================================

@app.get("/telemetry")
def telemetry():
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    return {
        "cpu": cpu,
        "memory_used_gb": round(mem.used / (1024**3), 1),
        "memory_total_gb": round(mem.total / (1024**3), 1),
        "memory_percent": mem.percent
    }

# =========================================================
# Memory and Profile APIs
# =========================================================

@app.get("/api/profile")
def api_get_profile():
    return get_profile()

@app.get("/api/history")
def api_get_history():
    return get_history()

@app.post("/api/history/clear")
def api_clear_history():
    clear_history()
    return {"status": "success", "message": "Conversation history cleared."}

class ProfileUpdate(BaseModel):
    updates: dict

@app.post("/api/profile/update")
def api_update_profile(request: ProfileUpdate):
    update_profile(request.updates)
    return {"status": "success", "profile": get_profile()}