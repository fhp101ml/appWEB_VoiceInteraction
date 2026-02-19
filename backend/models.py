from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class CategoriaEnum(str, enum.Enum):
    ALIMENTACION = "alimentacion"
    JUGUETES = "juguetes"
    ACCESORIOS = "accesorios"
    SALUD = "salud"
    HIGIENE = "higiene"
    OTROS = "otros"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    # Seccion/Rol could be kept as a generic "role" or stripped down, 
    # but for now we'll keep it simple or default to something generic if needed.
    # We can remove the enum requirement for user registration if it was tied to sections.
    # For simplicity in this refactor, I'll remove 'seccion' from user or default it to 'general'.
    role = Column(String(50), default="staff") 
    fecha_alta = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)
    is_admin = Column(Integer, default=0)
    
    # Relación con productos
    productos_registrados = relationship("Producto", back_populates="registrado_por_user")

class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    categoria = Column(Enum(CategoriaEnum), nullable=False)
    ubicacion = Column(String(200), nullable=False)
    cantidad = Column(Integer, default=1)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    registrado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relación
    registrado_por_user = relationship("User", back_populates="productos_registrados")
