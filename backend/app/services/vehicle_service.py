from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.views.vehicle_view import VehicleCreate, VehicleUpdate


class VehicleService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, det_id: Optional[int] = None) -> List[Vehicle]:
        query = db.query(Vehicle)
        if det_id:
            query = query.filter(Vehicle.det_id == det_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, vehicle_id: int) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    @staticmethod
    def create(db: Session, data: VehicleCreate) -> Vehicle:
        vehicle = Vehicle(
            vehicle_model_id=data.vehicle_model_id,
            vehicle_type=data.vehicle_type or "Standard",
            det_id=data.det_id,
            status=data.status or "Operational",
            critical_limit=data.critical_limit or 0.0
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def update(db: Session, vehicle_id: int, data: VehicleUpdate) -> Optional[Vehicle]:
        vehicle = VehicleService.get_by_id(db, vehicle_id)
        if not vehicle:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(vehicle, key, value)
        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def delete(db: Session, vehicle_id: int) -> bool:
        vehicle = VehicleService.get_by_id(db, vehicle_id)
        if not vehicle:
            return False
        db.delete(vehicle)
        db.commit()
        return True
