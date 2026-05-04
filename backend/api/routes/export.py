import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from geoalchemy2.shape import to_shape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import SignalReading
from api.deps import get_db

router = APIRouter(prefix="/export", tags=["export"])

CSV_FIELDS = [
    "id", "journey_id", "timestamp", "lat", "lng",
    "signal_dbm", "network_type", "mcc", "mnc", "speed_kmh",
    "platform", "app_version",
]


@router.get("/geojson")
async def export_geojson(db: AsyncSession = Depends(get_db)):
    stmt = select(SignalReading).where(SignalReading.location.isnot(None))
    result = await db.execute(stmt)
    readings = result.scalars().all()

    features = []
    for r in readings:
        pt = to_shape(r.location)
        features.append({
            "type": "Feature",
            "geometry": pt.__geo_interface__,
            "properties": {
                "timestamp": r.timestamp.isoformat(),
                "signal_dbm": r.signal_dbm,
                "network_type": r.network_type,
                "mcc": r.mcc,
                "mnc": r.mnc,
                "speed_kmh": r.speed_kmh,
            },
        })

    return JSONResponse({"type": "FeatureCollection", "features": features})


@router.get("/csv")
async def export_csv(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SignalReading))
    readings = result.scalars().all()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_FIELDS)
    writer.writeheader()

    for r in readings:
        pt = to_shape(r.location) if r.location else None
        writer.writerow({
            "id": r.id,
            "journey_id": r.journey_id,
            "timestamp": r.timestamp.isoformat(),
            "lat": pt.y if pt else None,
            "lng": pt.x if pt else None,
            "signal_dbm": r.signal_dbm,
            "network_type": r.network_type,
            "mcc": r.mcc,
            "mnc": r.mnc,
            "speed_kmh": r.speed_kmh,
            "platform": r.platform,
            "app_version": r.app_version,
        })

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=railsignal_export.csv"},
    )
