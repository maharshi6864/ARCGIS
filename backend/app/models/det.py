from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class Det(Base):
    __tablename__ = "dets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="det", cascade="all, delete-orphan")
    recoveries = relationship("Recovery", back_populates="det", cascade="all, delete-orphan")
    users = relationship("User", back_populates="det")
