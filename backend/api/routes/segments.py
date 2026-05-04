from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from geoalchemy2.shape import to_shape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import SegmentAggregate
from api.deps import get_db

router = APIRouter(prefix="/segments", tags=["segments"])


@router.get("")
async def get_segments(
    route_id: str = Query(..., description="Route identifier, e.g. BCN-FLA"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SegmentAggregate).where(SegmentAggregate.route_id == route_id)
    )
    segments = result.scalars().all()

    features = []
    for seg in segments:
        geom = to_shape(seg.segment_geom)
        features.append({
            "type": "Feature",
            "geometry": geom.__geo_interface__,
            "properties": {
                "operator": seg.operator,
                "avg_signal_dbm": seg.avg_signal_dbm,
                "pct_no_signal": seg.pct_no_signal,
                "pct_good": seg.pct_good,
                "dominant_net": seg.dominant_net,
                "sample_count": seg.sample_count,
                "updated_at": seg.updated_at.isoformat(),
            },
        })

    return JSONResponse({"type": "FeatureCollection", "features": features})
