import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import (
    Float, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Journey(Base):
    __tablename__ = "journey"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    reading_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    platform: Mapped[str | None] = mapped_column(Text)
    app_version: Mapped[str | None] = mapped_column(Text)

    readings: Mapped[list["SignalReading"]] = relationship(back_populates="journey")


class SignalReading(Base):
    __tablename__ = "signal_reading"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journey_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("journey.id"))
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)

    # Coordinates already snapped to ~50 m grid on-device before upload
    location: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326))

    signal_dbm: Mapped[int | None] = mapped_column(Integer)
    network_type: Mapped[str | None] = mapped_column(String(8))
    mcc: Mapped[str | None] = mapped_column(String(5))
    mnc: Mapped[str | None] = mapped_column(String(5))
    speed_kmh: Mapped[float | None] = mapped_column(Float)
    platform: Mapped[str | None] = mapped_column(Text)
    app_version: Mapped[str | None] = mapped_column(Text)

    journey: Mapped["Journey | None"] = relationship(back_populates="readings")


class SegmentAggregate(Base):
    __tablename__ = "segment_aggregate"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    segment_geom: Mapped[object] = mapped_column(Geometry("LINESTRING", srid=4326))
    route_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    operator: Mapped[str | None] = mapped_column(Text)
    avg_signal_dbm: Mapped[float | None] = mapped_column(Float)
    pct_no_signal: Mapped[float | None] = mapped_column(Float)
    pct_good: Mapped[float | None] = mapped_column(Float)
    dominant_net: Mapped[str | None] = mapped_column(Text)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=_now
    )
