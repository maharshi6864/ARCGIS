from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.vehicle_model import VehicleModel
from app.views.vehicle_model_view import VehicleModelCreate, VehicleModelUpdate


class VehicleModelService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[VehicleModel]:
        return db.query(VehicleModel).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, model_id: int) -> Optional[VehicleModel]:
        return db.query(VehicleModel).filter(VehicleModel.id == model_id).first()

    @staticmethod
    def create(db: Session, data: VehicleModelCreate) -> VehicleModel:
        model = VehicleModel(
            name=data.name.strip(),
            critical_margin=data.critical_margin or 0.0
        )
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def update(db: Session, model_id: int, data: VehicleModelUpdate) -> Optional[VehicleModel]:
        model = VehicleModelService.get_by_id(db, model_id)
        if not model:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(model, key, value)
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def delete(db: Session, model_id: int) -> bool:
        model = VehicleModelService.get_by_id(db, model_id)
        if not model:
            return False
        db.delete(model)
        db.commit()
        return True
