import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


NetworkType = Literal["5G", "4G", "3G", "2G", "none", "unknown"]


class ReadingIn(BaseModel):
    id: uuid.UUID
    journey_id: uuid.UUID | None = None
    timestamp: datetime
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    signal_dbm: int | None = Field(None, ge=-140, le=0)
    rsrp: int | None = Field(None, ge=-140, le=0)
    rsrq: int | None = Field(None, ge=-30, le=0)
    sinr: float | None = Field(None, ge=-30, le=50)
    network_type: NetworkType | None = None
    mcc: str | None = Field(None, max_length=5)
    mnc: str | None = Field(None, max_length=5)
    speed_kmh: float | None = Field(None, ge=0)
    gps_accuracy: float | None = Field(None, ge=0)
    pci: int | None = Field(None, ge=0, le=1007)
    earfcn: int | None = Field(None, ge=0)
    band: int | None = Field(None, ge=1)
    cqi: int | None = Field(None, ge=0, le=15)
    timing_advance: int | None = Field(None, ge=0, le=1282)
    cell_count: int | None = Field(None, ge=0)
    last_ping_ms: int | None = None
    platform: Literal["android", "ios"] | None = None
    app_version: str | None = None


class JourneyIn(BaseModel):
    id: uuid.UUID
    started_at: datetime
    ended_at: datetime | None = None
    platform: Literal["android", "ios"] | None = None
    app_version: str | None = None


class ReadingsBatch(BaseModel):
    journeys: list[JourneyIn] = []
    readings: list[ReadingIn] = Field(..., max_length=1000)


class BatchResult(BaseModel):
    accepted: int
    rejected: int
