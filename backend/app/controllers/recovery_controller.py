from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.recovery_service import RecoveryService
from app.views.recovery_view import RecoveryCreate, RecoveryUpdate, RecoveryResponse

router = APIRouter(prefix="/recoveries", tags=["Recoveries"])


@router.get("", response_model=List[RecoveryResponse])
def list_recoveries(
    skip: int = 0,
    limit: int = 100,
    det_id: Optional[int] = Query(None, description="Filter by Detachment ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by Recovery Status"),
    db: Session = Depends(get_db)
):
    return RecoveryService.get_all(db, skip=skip, limit=limit, det_id=det_id, status=status_filter)


@router.post("", response_model=RecoveryResponse, status_code=status.HTTP_201_CREATED)
def create_recovery(data: RecoveryCreate, db: Session = Depends(get_db)):
    return RecoveryService.create(db, data)


@router.get("/{recovery_id}", response_model=RecoveryResponse)
def get_recovery(recovery_id: int, db: Session = Depends(get_db)):
    recovery = RecoveryService.get_by_id(db, recovery_id)
    if not recovery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery record not found")
    return recovery


@router.put("/{recovery_id}", response_model=RecoveryResponse)
def update_recovery(recovery_id: int, data: RecoveryUpdate, db: Session = Depends(get_db)):
    recovery = RecoveryService.update(db, recovery_id, data)
    if not recovery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery record not found")
    return recovery


@router.delete("/{recovery_id}", status_code=status.HTTP_200_OK)
def delete_recovery(recovery_id: int, db: Session = Depends(get_db)):
    success = RecoveryService.delete(db, recovery_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery record not found")
    return {"message": f"Recovery record #{recovery_id} deleted successfully", "id": recovery_id}
