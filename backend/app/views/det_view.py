from typing import Optional
from pydantic import BaseModel, Field


class DetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Detachment Name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate")
    description: Optional[str] = Field(default="", description="Description or details")


class DetCreate(DetBase):
    pass


class DetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    description: Optional[str] = None


class DetResponse(DetBase):
    id: int

    class Config:
        from_attributes = True
