from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1 import feed, story, refresh, chat
from src.api.middleware import LoggingMiddleware

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


@app.get("/health")
async def health():
    return {"status": "ok"}
