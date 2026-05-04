from fastapi import APIRouter, Depends
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import SignalReading
from api.deps import get_db
from api.models.reading import BatchResult, ReadingsBatch

router = APIRouter(prefix="/readings", tags=["readings"])


@router.post("", response_model=BatchResult)
async def ingest_readings(batch: ReadingsBatch, db: AsyncSession = Depends(get_db)):
    accepted = 0
    rejected = 0

    for r in batch.readings:
        try:
            location = None
            if r.lat is not None and r.lng is not None:
                location = from_shape(Point(r.lng, r.lat), srid=4326)

            db.add(SignalReading(
                id=r.id,
                journey_id=r.journey_id,
                timestamp=r.timestamp,
                location=location,
                signal_dbm=r.signal_dbm,
                network_type=r.network_type,
                mcc=r.mcc,
                mnc=r.mnc,
                speed_kmh=r.speed_kmh,
                platform=r.platform,
                app_version=r.app_version,
            ))
            accepted += 1
        except Exception:
            rejected += 1

    await db.commit()
    return BatchResult(accepted=accepted, rejected=rejected)
