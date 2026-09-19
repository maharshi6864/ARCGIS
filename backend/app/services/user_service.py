import hashlib
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.views.user_view import UserCreate, UserUpdate


def hash_password(password: str) -> str:
    # SHA-256 for secure local credential storage
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class UserService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, det_id: Optional[int] = None) -> List[User]:
        query = db.query(User)
        if det_id:
            query = query.filter(User.det_id == det_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username.strip()).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.strip().lower()).first()

    @staticmethod
    def create(db: Session, data: UserCreate) -> User:
        user = User(
            username=data.username.strip(),
            email=data.email.strip().lower(),
            full_name=data.full_name.strip() if data.full_name else None,
            hashed_password=hash_password(data.password),
            role=data.role or "operator",
            det_id=data.det_id,
            is_active=data.is_active
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user_id: int, data: UserUpdate) -> Optional[User]:
        user = UserService.get_by_id(db, user_id)
        if not user:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        if "password" in update_dict and update_dict["password"]:
            update_dict["hashed_password"] = hash_password(update_dict.pop("password"))
        for key, value in update_dict.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        user = UserService.get_by_id(db, user_id)
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True
