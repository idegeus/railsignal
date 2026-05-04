from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import readings, segments, export, stats

app = FastAPI(
    title="RailSignal API",
    description="Crowdsourced mobile coverage data on rail corridors.",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(readings.router, prefix="/api/v1")
app.include_router(segments.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
