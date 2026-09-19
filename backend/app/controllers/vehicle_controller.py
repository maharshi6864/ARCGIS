from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.vehicle_service import VehicleService
from app.views.vehicle_view import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    skip: int = 0,
    limit: int = 100,
    det_id: Optional[int] = Query(None, description="Filter by Detachment ID"),
    db: Session = Depends(get_db)
):
    return VehicleService.get_all(db, skip=skip, limit=limit, det_id=det_id)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    return VehicleService.create(db, data)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = VehicleService.get_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = VehicleService.update(db, vehicle_id, data)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    success = VehicleService.delete(db, vehicle_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return {"message": f"Vehicle #{vehicle_id} deleted successfully", "id": vehicle_id}
