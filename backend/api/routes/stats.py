import time

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import Journey, SignalReading
from api.deps import get_db

router = APIRouter(prefix="/stats", tags=["stats"])

_cache: dict | None = None
_cache_at: float = 0.0
_TTL = 60.0


@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    global _cache, _cache_at
    if _cache is not None and time.monotonic() - _cache_at < _TTL:
        return JSONResponse(_cache, headers={"Cache-Control": f"max-age={int(_TTL)}"})

    readings = await db.scalar(select(func.count()).select_from(SignalReading))
    journeys = await db.scalar(select(func.count()).select_from(Journey))
    _cache = {"readings": readings or 0, "journeys": journeys or 0, "stations": 0}
    _cache_at = time.monotonic()
    return JSONResponse(_cache, headers={"Cache-Control": f"max-age={int(_TTL)}"})
