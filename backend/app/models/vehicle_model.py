from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database.base import Base


class VehicleModel(Base):
    __tablename__ = "vehicle_models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    critical_margin = Column(Float, nullable=True, default=0.0)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="model", cascade="all, delete-orphan")
