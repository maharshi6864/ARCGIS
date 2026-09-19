from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.det import Det
from app.views.det_view import DetCreate, DetUpdate


class DetService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Det]:
        return db.query(Det).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, det_id: int) -> Optional[Det]:
        return db.query(Det).filter(Det.id == det_id).first()

    @staticmethod
    def create(db: Session, data: DetCreate) -> Det:
        det = Det(
            name=data.name.strip(),
            latitude=data.latitude,
            longitude=data.longitude,
            description=data.description.strip() if data.description else ""
        )
        db.add(det)
        db.commit()
        db.refresh(det)
        return det

    @staticmethod
    def update(db: Session, det_id: int, data: DetUpdate) -> Optional[Det]:
        det = DetService.get_by_id(db, det_id)
        if not det:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(det, key, value)
        db.commit()
        db.refresh(det)
        return det

    @staticmethod
    def delete(db: Session, det_id: int) -> bool:
        det = DetService.get_by_id(db, det_id)
        if not det:
            return False
        db.delete(det)
        db.commit()
        return True
