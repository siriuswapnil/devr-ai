import os
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for docs context (for demo; use DB/cache in prod)
doc_context = ""

class DocUrlRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

@app.post("/upload_doc_url")
async def upload_doc_url(req: DocUrlRequest):
    global doc_context
    # Fetch the documentation text
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(req.url)
            resp.raise_for_status()
            doc_context = resp.text[:8000]  # limit for demo
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/chat")
async def chat(req: ChatRequest):
    global doc_context
    # Use the uploaded doc_context (from /upload_doc_url) instead of the hardcoded sample
    user_message = req.message
    prompt = f"API Documentation:\n{doc_context}\n\nUser: {user_message}\nAI:"
    ollama_url = "http://localhost:11434/api/generate"
    payload = {
        "model": "phi",  # or "llama2", "mistral", etc.
        "prompt": prompt,
        "stream": False
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(ollama_url, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            ai_response = data.get("response", "").strip()
            return {"response": ai_response}
    except Exception as e:
        return {"response": f"[Error from Ollama: {str(e)}]"}
