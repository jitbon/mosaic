import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.middleware import LoggingMiddleware
from src.api.v1 import chat, debate, feed, refresh, story

app = FastAPI(title="MosaicAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(feed.router, prefix="/api/v1", tags=["feed"])
app.include_router(story.router, prefix="/api/v1", tags=["story"])
app.include_router(refresh.router, prefix="/api/v1", tags=["refresh"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(debate.router, prefix="/api/v1", tags=["debate"])


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve Next.js static export if built with NEXT_EXPORT=1 (must be last — after all API routes)
# Build: cd web && NEXT_EXPORT=1 npm run build  (outputs to web/out/)
_web_out = os.path.join(os.path.dirname(__file__), "..", "..", "web", "out")
if os.path.isdir(_web_out):
    app.mount("/", StaticFiles(directory=_web_out, html=True), name="web")
