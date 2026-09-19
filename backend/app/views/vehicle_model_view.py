from typing import Optional
from pydantic import BaseModel, Field


class VehicleModelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Vehicle Model Name")
    critical_margin: Optional[float] = Field(default=0.0, description="Critical margin value")


class VehicleModelCreate(VehicleModelBase):
    pass


class VehicleModelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    critical_margin: Optional[float] = None


class VehicleModelResponse(VehicleModelBase):
    id: int

    class Config:
        from_attributes = True
