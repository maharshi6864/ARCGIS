from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])


@router.get("")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return StatsService.get_dashboard_stats(db)
