from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import Journey, SignalReading
from api.deps import get_db

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    readings = await db.scalar(select(func.count()).select_from(SignalReading))
    journeys = await db.scalar(select(func.count()).select_from(Journey))
    return {
        "readings": readings or 0,
        "journeys": journeys or 0,
        "stations": 0,
    }
