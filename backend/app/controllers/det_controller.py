from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.det_service import DetService
from app.views.det_view import DetCreate, DetUpdate, DetResponse

router = APIRouter(prefix="/dets", tags=["Detachments (Det)"])


@router.get("", response_model=List[DetResponse])
def list_dets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DetService.get_all(db, skip=skip, limit=limit)


@router.post("", response_model=DetResponse, status_code=status.HTTP_201_CREATED)
def create_det(data: DetCreate, db: Session = Depends(get_db)):
    return DetService.create(db, data)


@router.get("/{det_id}", response_model=DetResponse)
def get_det(det_id: int, db: Session = Depends(get_db)):
    det = DetService.get_by_id(db, det_id)
    if not det:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detachment not found")
    return det


@router.put("/{det_id}", response_model=DetResponse)
def update_det(det_id: int, data: DetUpdate, db: Session = Depends(get_db)):
    det = DetService.update(db, det_id, data)
    if not det:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detachment not found")
    return det


@router.delete("/{det_id}", status_code=status.HTTP_200_OK)
def delete_det(det_id: int, db: Session = Depends(get_db)):
    success = DetService.delete(db, det_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detachment not found")
    return {"message": f"Detachment #{det_id} deleted successfully", "id": det_id}
