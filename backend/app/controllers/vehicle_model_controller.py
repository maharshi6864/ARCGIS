from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.vehicle_model_service import VehicleModelService
from app.views.vehicle_model_view import VehicleModelCreate, VehicleModelUpdate, VehicleModelResponse

router = APIRouter(prefix="/vehicle-models", tags=["Vehicle Models"])


@router.get("", response_model=List[VehicleModelResponse])
def list_vehicle_models(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return VehicleModelService.get_all(db, skip=skip, limit=limit)


@router.post("", response_model=VehicleModelResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle_model(data: VehicleModelCreate, db: Session = Depends(get_db)):
    return VehicleModelService.create(db, data)


@router.get("/{model_id}", response_model=VehicleModelResponse)
def get_vehicle_model(model_id: int, db: Session = Depends(get_db)):
    model = VehicleModelService.get_by_id(db, model_id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle model not found")
    return model


@router.put("/{model_id}", response_model=VehicleModelResponse)
def update_vehicle_model(model_id: int, data: VehicleModelUpdate, db: Session = Depends(get_db)):
    model = VehicleModelService.update(db, model_id, data)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle model not found")
    return model


@router.delete("/{model_id}", status_code=status.HTTP_200_OK)
def delete_vehicle_model(model_id: int, db: Session = Depends(get_db)):
    success = VehicleModelService.delete(db, model_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle model not found")
    return {"message": f"Vehicle model #{model_id} deleted successfully", "id": model_id}
