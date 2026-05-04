"""
Hourly aggregation job: groups signal_reading rows into segment_aggregate.

Run via:
  python -m jobs.aggregate

Or add to cron inside the Docker container:
  0 * * * * cd /app && python -m jobs.aggregate >> /var/log/aggregate.log 2>&1
"""

import asyncio
import logging

from sqlalchemy import delete, select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import SignalReading, SegmentAggregate
from api.db.session import AsyncSessionLocal

log = logging.getLogger(__name__)

# ~50 m grid snapping (must match on-device value in journeyDetector.ts)
GRID_DEG = 0.00045

ROUTE_ID = "BCN-FLA"


async def run(db: AsyncSession) -> None:
    log.info("Starting aggregation for route %s", ROUTE_ID)

    # Snap readings to grid and group
    stmt = text("""
        SELECT
            round(ST_Y(location::geometry) / :grid) * :grid  AS lat_snap,
            round(ST_X(location::geometry) / :grid) * :grid  AS lng_snap,
            mnc,
            AVG(signal_dbm)                                   AS avg_dbm,
            COUNT(*)                                           AS cnt,
            SUM(CASE WHEN signal_dbm IS NULL THEN 1 ELSE 0 END)::float / COUNT(*) AS pct_none,
            SUM(CASE WHEN signal_dbm > -85   THEN 1 ELSE 0 END)::float / COUNT(*) AS pct_good,
            MODE() WITHIN GROUP (ORDER BY network_type)        AS dominant_net
        FROM signal_reading
        WHERE location IS NOT NULL
        GROUP BY lat_snap, lng_snap, mnc
    """).bindparams(grid=GRID_DEG)

    result = await db.execute(stmt)
    rows = result.fetchall()

    await db.execute(delete(SegmentAggregate).where(SegmentAggregate.route_id == ROUTE_ID))

    for row in rows:
        pt_wkt = f"POINT({row.lng_snap} {row.lat_snap})"
        seg = SegmentAggregate(
            segment_geom=f"SRID=4326;{pt_wkt}",
            route_id=ROUTE_ID,
            operator=row.mnc,
            avg_signal_dbm=row.avg_dbm,
            pct_no_signal=row.pct_none,
            pct_good=row.pct_good,
            dominant_net=row.dominant_net,
            sample_count=row.cnt,
        )
        db.add(seg)

    await db.commit()
    log.info("Aggregation complete: %d segments written", len(rows))


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    async with AsyncSessionLocal() as db:
        await run(db)


if __name__ == "__main__":
    asyncio.run(main())
