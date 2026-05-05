from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import Journey, SignalReading
from api.deps import get_db
from api.models.reading import BatchResult, ReadingsBatch

router = APIRouter(prefix="/readings", tags=["readings"])


def _client_ip(request: Request) -> str | None:
    # Caddy (and most proxies) set X-Forwarded-For; take the leftmost address.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("", response_model=BatchResult)
async def ingest_readings(
    batch: ReadingsBatch,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if not batch.readings:
        return BatchResult(accepted=0, rejected=0)

    received_at = datetime.now(timezone.utc)
    uploader_ip = _client_ip(request)

    if batch.journeys:
        journey_rows = [
            {
                "id": j.id,
                "started_at": j.started_at,
                "ended_at": j.ended_at,
                "platform": j.platform,
                "app_version": j.app_version,
            }
            for j in batch.journeys
        ]
        await db.execute(
            pg_insert(Journey).values(journey_rows).on_conflict_do_nothing(index_elements=["id"])
        )

    rows = []
    for r in batch.readings:
        location = None
        if r.lat is not None and r.lng is not None:
            location = from_shape(Point(r.lng, r.lat), srid=4326)
        rows.append({
            "id": r.id,
            "journey_id": r.journey_id,
            "timestamp": r.timestamp,
            "location": location,
            "signal_dbm": r.signal_dbm,
            "rsrp": r.rsrp,
            "rsrq": r.rsrq,
            "sinr": r.sinr,
            "network_type": r.network_type,
            "mcc": r.mcc,
            "mnc": r.mnc,
            "speed_kmh": r.speed_kmh,
            "gps_accuracy": r.gps_accuracy,
            "pci": r.pci,
            "earfcn": r.earfcn,
            "band": r.band,
            "cqi": r.cqi,
            "timing_advance": r.timing_advance,
            "cell_count": r.cell_count,
            "last_ping_ms": r.last_ping_ms,
            "last_ping_latency_ms": r.last_ping_latency_ms,
            "platform": r.platform,
            "app_version": r.app_version,
            "received_at": received_at,
            "uploader_ip": uploader_ip,
        })

    stmt = pg_insert(SignalReading).values(rows).on_conflict_do_nothing(index_elements=["id"])
    result = await db.execute(stmt)
    await db.commit()

    accepted = result.rowcount
    return BatchResult(accepted=accepted, rejected=len(rows) - accepted)
