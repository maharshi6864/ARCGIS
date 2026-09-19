from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_model_id = Column(Integer, ForeignKey("vehicle_models.id", ondelete="CASCADE"), nullable=False)
    vehicle_type = Column(String(100), nullable=True)
    det_id = Column(Integer, ForeignKey("dets.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="Serviceable")  # Serviceable | Unserviceable
    critical_limit = Column(Float, nullable=True, default=0.0)

    # Relationships
    model = relationship("VehicleModel", back_populates="vehicles")
    det = relationship("Det", back_populates="vehicles")
    recoveries = relationship("Recovery", secondary="recovery_vehicles", back_populates="vehicles")
