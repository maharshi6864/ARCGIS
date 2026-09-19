from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.views.det_view import DetResponse
from app.views.vehicle_view import VehicleResponse


class RecoveryBase(BaseModel):
    date: str
    time_taken_recovery: float = 0.0
    det_id: int
    description: Optional[str] = None
    casualty_type: str = "Heavy Vehicle"
    cas_vehicle_equipment_name: Optional[str] = None
    from_lat: float = 28.6139
    from_lng: float = 77.2090
    from_place_description: Optional[str] = None
    to_lat: float = 28.6139
    to_lng: float = 77.2090
    to_place_description: Optional[str] = None
    effectiveness_index: float = 100.0
    call_received_time: Optional[str] = None
    time_to_reach: float = 0.0
    status: str = "Active"


class RecoveryCreate(RecoveryBase):
    vehicle_ids: Optional[List[int]] = []


class RecoveryUpdate(BaseModel):
    date: Optional[str] = None
    time_taken_recovery: Optional[float] = None
    det_id: Optional[int] = None
    description: Optional[str] = None
    casualty_type: Optional[str] = None
    cas_vehicle_equipment_name: Optional[str] = None
    from_lat: Optional[float] = None
    from_lng: Optional[float] = None
    from_place_description: Optional[str] = None
    to_lat: Optional[float] = None
    to_lng: Optional[float] = None
    to_place_description: Optional[str] = None
    effectiveness_index: Optional[float] = None
    call_received_time: Optional[str] = None
    time_to_reach: Optional[float] = None
    status: Optional[str] = None
    vehicle_ids: Optional[List[int]] = None


class RecoveryResponse(RecoveryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    det: Optional[DetResponse] = None
    vehicles: List[VehicleResponse] = []

    model_config = ConfigDict(from_attributes=True)
