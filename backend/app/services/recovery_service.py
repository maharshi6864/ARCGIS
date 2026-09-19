from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.recovery import Recovery
from app.models.vehicle import Vehicle
from app.views.recovery_view import RecoveryCreate, RecoveryUpdate


class RecoveryService:
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        det_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Recovery]:
        query = (
            db.query(Recovery)
            .options(
                joinedload(Recovery.det),
                joinedload(Recovery.vehicles).joinedload(Vehicle.model),
            )
        )
        if det_id:
            query = query.filter(Recovery.det_id == det_id)
        if status:
            query = query.filter(Recovery.status.ilike(status))
        return query.order_by(Recovery.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, recovery_id: int) -> Optional[Recovery]:
        return (
            db.query(Recovery)
            .options(
                joinedload(Recovery.det),
                joinedload(Recovery.vehicles).joinedload(Vehicle.model),
            )
            .filter(Recovery.id == recovery_id)
            .first()
        )

    @staticmethod
    def create(db: Session, data: RecoveryCreate) -> Recovery:
        recovery = Recovery(
            date=data.date,
            time_taken_recovery=data.time_taken_recovery,
            det_id=data.det_id,
            description=data.description,
            casualty_type=data.casualty_type,
            cas_vehicle_equipment_name=data.cas_vehicle_equipment_name,
            from_lat=data.from_lat,
            from_lng=data.from_lng,
            from_place_description=data.from_place_description,
            to_lat=data.to_lat,
            to_lng=data.to_lng,
            to_place_description=data.to_place_description,
            effectiveness_index=data.effectiveness_index,
            call_received_time=data.call_received_time,
            time_to_reach=data.time_to_reach,
            status=data.status or "Completed",
        )

        if data.vehicle_ids:
            vehicles = db.query(Vehicle).filter(Vehicle.id.in_(data.vehicle_ids)).all()
            recovery.vehicles = vehicles

        db.add(recovery)
        db.commit()
        db.refresh(recovery)
        return RecoveryService.get_by_id(db, recovery.id)

    @staticmethod
    def update(db: Session, recovery_id: int, data: RecoveryUpdate) -> Optional[Recovery]:
        recovery = RecoveryService.get_by_id(db, recovery_id)
        if not recovery:
            return None
        
        update_dict = data.model_dump(exclude_unset=True)
        vehicle_ids = update_dict.pop("vehicle_ids", None)

        for key, value in update_dict.items():
            setattr(recovery, key, value)

        if vehicle_ids is not None:
            vehicles = db.query(Vehicle).filter(Vehicle.id.in_(vehicle_ids)).all()
            recovery.vehicles = vehicles

        db.commit()
        db.refresh(recovery)
        return RecoveryService.get_by_id(db, recovery.id)

    @staticmethod
    def delete(db: Session, recovery_id: int) -> bool:
        recovery = RecoveryService.get_by_id(db, recovery_id)
        if not recovery:
            return False
        db.delete(recovery)
        db.commit()
        return True
