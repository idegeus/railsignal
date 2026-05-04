import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


NetworkType = Literal["5G", "4G", "3G", "2G", "none", "unknown"]


class ReadingIn(BaseModel):
    id: uuid.UUID
    journey_id: uuid.UUID | None = None
    timestamp: datetime
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    signal_dbm: int | None = Field(None, ge=-140, le=0)
    network_type: NetworkType | None = None
    mcc: str | None = Field(None, max_length=5)
    mnc: str | None = Field(None, max_length=5)
    speed_kmh: float | None = Field(None, ge=0)
    platform: Literal["android", "ios"] | None = None
    app_version: str | None = None


class ReadingsBatch(BaseModel):
    readings: list[ReadingIn] = Field(..., max_length=1000)


class BatchResult(BaseModel):
    accepted: int
    rejected: int
