from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base


# Many-to-Many Association Table between Recovery Operations and Vehicles deployed
recovery_vehicles = Table(
    "recovery_vehicles",
    Base.metadata,
    Column("recovery_id", Integer, ForeignKey("recoveries.id", ondelete="CASCADE"), primary_key=True),
    Column("vehicle_id", Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), primary_key=True),
)


class Recovery(Base):
    __tablename__ = "recoveries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 1. Date of recovery activity
    date = Column(String(50), nullable=False, index=True)
    
    # 2. Time taken to complete recovery activity (in hours / minutes)
    time_taken_recovery = Column(Float, default=0.0, nullable=False)
    
    # 3. Det (det_id)
    det_id = Column(Integer, ForeignKey("dets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 4. Description of recovery activity
    description = Column(Text, nullable=True)
    
    # 5. Activity Performed (Casualty Type: Generator, Heavy Vehicle, Light Vehicle, Miscellaneous, Special Vehicle, Engineering Equipment)
    casualty_type = Column(String(255), nullable=False, default="Heavy Vehicle")

    # Specific Casualty Vehicle / Equipment Name (e.g., "30 KVA Genr", "2.5 Ton", "15 KVA Genr", "Hydra Crane")
    cas_vehicle_equipment_name = Column(String(255), nullable=True)
    
    # 6. From place (coords + description)
    from_lat = Column(Float, nullable=False, default=28.6139)
    from_lng = Column(Float, nullable=False, default=77.2090)
    from_place_description = Column(String(255), nullable=True)
    
    # 7. To place (coords + description)
    to_lat = Column(Float, nullable=False, default=28.6139)
    to_lng = Column(Float, nullable=False, default=77.2090)
    to_place_description = Column(String(255), nullable=True)
    
    # Deprecated equipment_type kept with default empty string for backward compatibility with sqlite schema
    equipment_type = Column(String(255), default="", nullable=True)
    
    # 8. Recovery effectiveness index (manual score)
    effectiveness_index = Column(Float, default=100.0, nullable=False)
    
    # 9. Call Received Time (e.g. "14:30" or ISO timestamp)
    call_received_time = Column(String(50), nullable=True)
    
    # 10. Time taken to reach the casualty location (in hours / minutes)
    time_to_reach = Column(Float, default=0.0, nullable=False)
    
    # 11. Recovery Status (Strictly: Active, Abort, Completed)
    status = Column(String(50), default="Active", nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to Detachment
    det = relationship("Det", back_populates="recoveries")

    # Many-to-Many Relationship to Multiple Tactical Vehicles deployed in this recovery
    vehicles = relationship("Vehicle", secondary=recovery_vehicles, back_populates="recoveries")
