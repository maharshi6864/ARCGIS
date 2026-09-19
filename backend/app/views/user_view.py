from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr = Field(...)
    full_name: Optional[str] = Field(default=None, max_length=255)
    role: str = Field(default="operator", max_length=50)
    det_id: Optional[int] = Field(default=None, description="Assigned Detachment ID")
    is_active: bool = Field(default=True)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plain text password to be hashed")


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    det_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
