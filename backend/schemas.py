from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from models import CategoriaEnum

# ===== AUTH SCHEMAS =====
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ===== USER SCHEMAS =====
class UserBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = "staff"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    fecha_alta: datetime
    is_active: bool
    is_admin: bool
    
    class Config:
        from_attributes = True

# ===== PRODUCTO SCHEMAS =====
class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=200)
    descripcion: Optional[str] = None
    categoria: CategoriaEnum
    ubicacion: str = Field(..., min_length=2, max_length=200)
    cantidad: int = Field(default=1, ge=0)

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[CategoriaEnum] = None
    ubicacion: Optional[str] = None
    cantidad: Optional[int] = None

class Producto(ProductoBase):
    id: int
    fecha_registro: datetime
    registrado_por: Optional[int]
    
    class Config:
        from_attributes = True
