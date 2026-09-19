from typing import Optional
from pydantic import BaseModel, Field
from .vehicle_model_view import VehicleModelResponse
from .det_view import DetResponse


class VehicleBase(BaseModel):
    vehicle_model_id: int = Field(..., description="Foreign key to VehicleModel")
    vehicle_type: Optional[str] = Field(default="Standard", description="Vehicle type classification")
    det_id: int = Field(..., description="Foreign key to Det")
    status: str = Field(default="Serviceable", description="Readiness status (Serviceable or Unserviceable)")
    critical_limit: Optional[float] = Field(default=0.0, description="Critical limit threshold")


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_model_id: Optional[int] = None
    vehicle_type: Optional[str] = None
    det_id: Optional[int] = None
    status: Optional[str] = None
    critical_limit: Optional[float] = None


class VehicleResponse(VehicleBase):
    id: int
    model: Optional[VehicleModelResponse] = None
    det: Optional[DetResponse] = None

    class Config:
        from_attributes = True
