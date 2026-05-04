import csv
import io
import os

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from geoalchemy2.shape import to_shape
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import SignalReading
from api.deps import get_db

router = APIRouter(prefix="/export", tags=["export"])

# R11 track geometry loaded once at startup.
# Used to exclude readings more than 200 m from the track (anonymisation).
_WKT_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'r11_track.wkt')
with open(_WKT_PATH) as _f:
    _R11_TRACK_WKT = _f.read().strip()

_TRACK_BUFFER_M = 200

CSV_FIELDS = [
    "id", "journey_id", "timestamp", "lat", "lng",
    "signal_dbm", "network_type", "mcc", "mnc", "speed_kmh",
    "platform", "app_version",
]


def _within_track(column):
    """True if the geometry column is within 200 m of the R11 track."""
    return func.ST_DWithin(
        func.ST_GeogFromWKB(column),
        func.ST_GeogFromText(_R11_TRACK_WKT),
        _TRACK_BUFFER_M,
    )


@router.get("/geojson")
async def export_geojson(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SignalReading)
        .where(SignalReading.location.isnot(None))
        .where(_within_track(SignalReading.location))
    )
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
