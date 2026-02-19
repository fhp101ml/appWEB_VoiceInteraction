# Guía de Implementación: Sistema de Gestión de Inventario de Tienda de Mascotas

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración del Backend](#configuración-del-backend)
4. [Implementación de la Base de Datos](#implementación-de-la-base-de-datos)
5. [Sistema de Autenticación](#sistema-de-autenticación)
6. [API REST - Endpoints](#api-rest-endpoints)
7. [Adaptación del Agente IA](#adaptación-del-agente-ia)
8. [Configuración del Frontend](#configuración-del-frontend)
10. [Integración Voz/Chat con CRUD](#integración-vozchat-con-crud)
11. [Actualizaciones en Tiempo Real](#actualizaciones-en-tiempo-real)
12. [Pruebas y Verificación](#pruebas-y-verificación)
11. [Actualizaciones en Tiempo Real](#actualizaciones-en-tiempo-real)
12. [Pruebas y Verificación](#pruebas-y-verificación)

---

## 1. Visión General

### Objetivo
Transformar la aplicación actual de registro simple en un **Sistema de Gestión de Inventario de Tienda de Mascotas** con:
- Gestión de usuarios y productos
- Autenticación con Bearer Token
- Operaciones CRUD completas
- Interacción por voz y chat mantenida

### Estructura de Datos

**Usuarios:**
- ID (generado automáticamente)
- Nombre completo
- Correo electrónico (único)
- Rol (staff/admin)
- Fecha de alta

**Productos:**
- ID (generado automáticamente)
- Nombre del producto
- Descripción
- Categoría
- Ubicación en la tienda/almacén
- Cantidad
- Fecha de registro

**Categorías:**
- Alimentación
- Juguetes
- Accesorios
- Salud
- Higiene
- Otros

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Login      │  │   Dashboard  │  │   Forms      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  User List   │  │ Product List │  │  Voice/Chat  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                    Bearer Token Auth
                            │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Layer                     │  │
│  │         (JWT Token Generation & Validation)           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Endpoints                       │  │
│  │  /auth/login  /auth/register  /auth/refresh          │  │
│  │  /users       /products       /categories             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI Agent Integration                     │  │
│  │        (Voice/Chat → CRUD Operations)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite/PostgreSQL)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  users   │  │ products │  │categories│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Configuración del Backend

### Paso 1: Instalar Dependencias Adicionales

```bash
cd backend
source venv/bin/activate
pip install sqlalchemy alembic passlib[bcrypt] python-jose[cryptography] python-multipart
pip freeze > requirements.txt
```

**Paquetes añadidos:**
- `sqlalchemy`: ORM para base de datos
- `alembic`: Migraciones de base de datos
- `passlib[bcrypt]`: Hash de contraseñas
- `python-jose[cryptography]`: Generación y validación de JWT
- `python-multipart`: Manejo de formularios multipart

### Paso 2: Estructura de Carpetas

```
backend/
├── venv/
├── main.py
├── voice_processor.py
├── agent.py
├── schemas.py
├── database.py          # NUEVO
├── models.py            # NUEVO
├── auth.py              # NUEVO
├── dependencies.py      # NUEVO
├── routers/             # NUEVO
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   └── products.py      # RENAMED
├── alembic/             # NUEVO (generado)
├── alembic.ini          # NUEVO
├── .env
└── requirements.txt
```

---

## 4. Implementación de la Base de Datos

### Paso 1: Crear `database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite para desarrollo, PostgreSQL para producción
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pet_shop_inventory.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency para obtener sesión de BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Paso 2: Crear `models.py`

```python
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
    role = Column(String(50), default="staff") # Antes seccion
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
```

### Paso 3: Actualizar `schemas.py`

```python
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

# ===== PRODUCTOS SCHEMAS =====
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
```

### Paso 4: Inicializar Base de Datos

```bash
# Crear tablas
python -c "from database import engine, Base; from models import User, Producto; Base.metadata.create_all(bind=engine)"
```

---

## 5. Sistema de Autenticación

### Paso 1: Crear `auth.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera hash de contraseña"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    """Decodifica y valida un JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### Paso 2: Crear `dependencies.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth import decode_token
from models import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Obtiene el usuario actual desde el token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifica que el usuario actual sea administrador"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return current_user
```

---

## 6. API REST - Endpoints

### Paso 1: Crear `routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
from models import User
from schemas import Token, UserCreate, User as UserSchema
from auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserSchema)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario"""
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Inicia sesión y devuelve un token JWT"""
    # Buscar usuario por email (username en el form)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
```

### Paso 2: Crear `routers/users.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User
from schemas import User as UserSchema, UserUpdate
from dependencies import get_current_user, get_current_admin_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserSchema)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Obtiene el perfil del usuario actual"""
    return current_user

@router.get("/", response_model=List[UserSchema])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios (requiere autenticación)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserSchema)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene un usuario por ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza un usuario (solo el propio usuario o admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Solo el mismo usuario o admin pueden actualizar
    if user.id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Actualizar campos
    if user_update.nombre is not None:
        user.nombre = user_update.nombre
    if user_update.role is not None:
        user.role = user_update.role
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Elimina un usuario (solo admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return None
```

### Paso 3: Crear `routers/products.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Producto, User
from schemas import Producto as ProductoSchema, ProductoCreate, ProductoUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductoSchema, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuevo producto"""
    new_product = Producto(
        **product_data.dict(),
        registrado_por=current_user.id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product

@router.get("/", response_model=List[ProductoSchema])
def list_products(
    skip: int = 0,
    limit: int = 100,
    categoria: Optional[str] = None,
    ubicacion: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista productos con filtros opcionales"""
    query = db.query(Producto)
    
    if categoria:
        query = query.filter(Producto.categoria == categoria)
    if ubicacion:
        query = query.filter(Producto.ubicacion.contains(ubicacion))
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductoSchema)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene un producto por ID"""
    product = db.query(Producto).filter(Producto.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return product

@router.put("/{product_id}", response_model=ProductoSchema)
def update_product(
    product_id: int,
    product_update: ProductoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza un producto"""
    product = db.query(Producto).filter(Producto.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Actualizar campos
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina un producto"""
    product = db.query(Producto).filter(Producto.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Solo admin o quien lo creó puede eliminarlo
    if product.registrado_por != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    db.delete(product)
    db.commit()
    return None
```

### Paso 4: Actualizar `main.py`

```python
import socketio
import uvicorn
import asyncio
import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Local modules
from voice_processor import VoiceProcessor
from agent import InteractionAgent
from database import engine, Base
from models import User, Producto

# Routers
from routers import auth, users, products

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(title="Pet Shop Inventory API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)

# Initialize Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Initialize Components
voice_processor = VoiceProcessor()
agent = InteractionAgent()

print("✅ Pet Shop Inventory System Initialized")

@app.get("/")
async def root():
    return {"message": "Pet Shop Inventory API", "version": "2.0.0"}

# ... (resto del código de socket.io como antes) ...

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8001, reload=True)
```

---

## 7. Adaptación del Agente IA

### Actualizar `agent.py` para CRUD Operations

```python
# Añadir imports
from database import get_db, SessionLocal
from models import Producto, User as UserModel, CategoriaEnum
from sqlalchemy.orm import Session

class InteractionAgent:
    def __init__(self):
        # ... código existente ...
        
        # NUEVAS HERRAMIENTAS para CRUD
        @tool
        def crear_producto(
            nombre: str, 
            categoria: str, 
            ubicacion: str, 
            cantidad: int = 1,
            descripcion: str = ""
        ):
            """
            Crea un nuevo producto en la base de datos.
            Args:
                nombre: Nombre del producto
                categoria: Categoría (alimentacion, juguetes, accesorios, etc)
                ubicacion: Ubicación física en la tienda
                cantidad: Cantidad disponible (por defecto 1)
                descripcion: Descripción opcional del producto
            """
            try:
                db = SessionLocal()
                # Validar categoría
                categoria_enum = CategoriaEnum(categoria.lower())
                
                new_product = Producto(
                    nombre=nombre,
                    descripcion=descripcion,
                    categoria=categoria_enum,
                    ubicacion=ubicacion,
                    cantidad=cantidad,
                    registrado_por=1  # Usuario del sistema por voz
                )
                
                db.add(new_product)
                db.commit()
                db.refresh(new_product)
                
                return json.dumps({
                    "action": "producto_created",
                    "product_id": new_product.id,
                    "nombre": nombre
                })
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        @tool
        def listar_productos(categoria: str = ""):
            """
            Lista los productos, opcionalmente filtrados por categoría.
            Args:
                categoria: Categoría para filtrar (opcional)
            """
            try:
                db = SessionLocal()
                query = db.query(Producto)
                
                if categoria:
                    categoria_enum = CategoriaEnum(categoria.lower())
                    query = query.filter(Producto.categoria == categoria_enum)
                
                products = query.limit(10).all()
                
                result = {
                    "action": "products_listed",
                    "count": len(products),
                    "products": [
                        {
                            "id": p.id,
                            "nombre": p.nombre,
                            "categoria": p.categoria.value,
                            "ubicacion": p.ubicacion,
                            "cantidad": p.cantidad
                        }
                        for p in products
                    ]
                }
                
                return json.dumps(result)
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        @tool
        def actualizar_producto(product_id: int, campo: str, nuevo_valor: str):
            """
            Actualiza un campo de un producto.
            Args:
                product_id: ID del producto a actualizar
                campo: Campo a modificar (nombre, ubicacion, cantidad, categoria)
                nuevo_valor: Nuevo valor para el campo
            """
            try:
                db = SessionLocal()
                product = db.query(Producto).filter(Producto.id == product_id).first()
                
                if not product:
                    return json.dumps({"action": "error", "message": "Producto no encontrado"})
                
                if campo == "cantidad":
                    product.cantidad = int(nuevo_valor)
                elif campo == "categoria":
                    product.categoria = CategoriaEnum(nuevo_valor.lower())
                elif campo in ["nombre", "ubicacion"]:
                    setattr(product, campo, nuevo_valor)
                
                db.commit()
                
                return json.dumps({
                    "action": "product_updated",
                    "product_id": product_id,
                    "campo": campo
                })
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        @tool
        def eliminar_producto(product_id: int):
            """
            Elimina un producto de la base de datos.
            Args:
                product_id: ID del producto a eliminar
            """
            try:
                db = SessionLocal()
                product = db.query(Producto).filter(Producto.id == product_id).first()
                
                if not product:
                    return json.dumps({"action": "error", "message": "Producto no encontrado"})
                
                nombre = product.nombre
                db.delete(product)
                db.commit()
                
                return json.dumps({
                    "action": "product_deleted",
                    "product_id": product_id,
                    "nombre": nombre
                })
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        # Actualizar lista de herramientas
        self.tools = [
            update_form, 
            submit_form,
            crear_producto,
            listar_productos,
            actualizar_producto,
            eliminar_producto
        ]
        
        # Actualizar prompt del sistema
        self.system_prompt = """Eres un asistente de voz para un sistema de gestión de inventario de tienda de mascotas.

CAPACIDADES:
1. Gestión de Formularios (update_form, submit_form)
2. Gestión de Productos (crear_producto, listar_productos, actualizar_producto, eliminar_producto)

CATEGORÍAS DE TIENDA:
- Alimentacion
- Juguetes
- Accesorios
- Salud
- Higiene
- Otros

EJEMPLOS DE COMANDOS:
- "Añade un saco de pienso de 20kg para perros en el almacén principal"
- "Lista los productos de alimentación"
- "Actualiza la cantidad del producto 5 a 10 unidades"
- "Elimina el producto número 3"

Responde de forma concisa y confirma las acciones realizadas."""
```

---

## 8. Configuración del Frontend

### Paso 1: Instalar Dependencias

```bash
cd frontend
npm install axios react-router-dom @tanstack/react-query zustand-persist
```

### Paso 2: Crear Store de Autenticación

```javascript
// frontend/src/stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Paso 3: Crear Cliente API

```javascript
// frontend/src/api/client.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor para añadir token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', 
      new URLSearchParams({ username: email, password })
    ),
  register: (data) => apiClient.post('/auth/register', data),
};

// Users API
export const usersAPI = {
  getMe: () => apiClient.get('/users/me'),
  list: () => apiClient.get('/users/'),
  get: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

// Products API
export const productsAPI = {
  create: (data) => apiClient.post('/products/', data),
  list: (params) => apiClient.get('/products/', { params }),
  get: (id) => apiClient.get(`/products/${id}`),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export default apiClient;
```

### Paso 4: Crear Componente de Login

```javascript
// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authAPI, usersAPI } from '../api/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await authAPI.login(email, password);
      const token = response.data.access_token;
      
      // Obtener datos del usuario
      const userResponse = await usersAPI.getMe();
      
      setAuth(token, userResponse.data);
    } catch (err) {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: 'var(--gradient-mesh), var(--bg-primary)' }}>
      <div className="glass-effect rounded-4 p-5 shadow-xl" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="h3 fw-bold gradient-text mb-4 text-center">Iniciar Sesión</h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-100 py-3">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

---

## 9. Integración Voz/Chat con CRUD

El agente IA actualizado en el paso 7 ya incluye las herramientas necesarias para:

1. **Crear productos** via voz: _"Añade un collar antipulgas en la estantería 2"_
2. **Listar productos** via voz: _"Muéstrame los productos de higiene"_
3. **Actualizar productos** via voz: _"Cambia la ubicación del producto 5 a mostrador"_
4. **Eliminar productos** via voz: _"Elimina el producto número 8"_

El sistema procesará estos comandos automáticamente y ejecutará las operaciones en la base de datos.

---

## 11. Actualizaciones en Tiempo Real

Para asegurar que la interfaz reacciona instantáneamente a los cambios realizados por voz o chat:

### Estrategia: Eventos Globales
El hook `useAudio` despacha un evento global cuando recibe una acción de modificación de datos.

**En `useAudio.js`:**
```javascript
// Dentro de socket.on('voice_response') y 'chat_response'
if (['producto_created', 'product_updated', 'product_deleted'].includes(action.action)) {
    window.dispatchEvent(new CustomEvent('products_updated'));
}
```

**En `ProductsManager.jsx`:**
```javascript
React.useEffect(() => {
    const handleUpdates = () => {
        // Invalidar caché de React Query para forzar recarga
        queryClient.invalidateQueries(['products']);
    };

    window.addEventListener('products_updated', handleUpdates);
    return () => window.removeEventListener('products_updated', handleUpdates);
}, [queryClient]);
```



## 12. Relleno Interactivo de Formularios por Voz

Para permitir que el usuario "dicte" los datos y vea cómo se rellena el formulario en tiempo real:

1.  **Sincronización de Estado**: El componente `ProductsManager` se suscribe al `interactionStore` donde el agente escribe los datos parciales.
2.  **Eventos de Control**: El agente puede enviar acciones como `open_product_form` para abrir el modal automáticamente.

### Implementación

**En `agent.py`:**
Se añade la herramienta `abrir_formulario_producto`:
```python
@tool
def abrir_formulario_producto():
    """Abre el formulario de creación de producto en la interfaz."""
    return json.dumps({"action": "open_product_form"})
```

**En `ProductsManager.jsx`:**
```javascript
// Escuchar evento de apertura
window.addEventListener('open_product_form', () => handleShow());

// Sincronizar campos con Store
const { formData: agentFormData } = useInteractionStore();
useEffect(() => {
    if (showModal && agentFormData) {
        setFormData(prev => ({...prev, ...agentFormData}));
    }
}, [agentFormData, showModal]);
```

---

## 13. Guía de Extensión: ¿Cómo crear nuevas interacciones?

Para replicar este comportamiento (abrir formularios, actualizar vistas) en otras partes del sistema, sigue este "patrón de 4 pasos":

### 1. Backend: Definir la Intención (`agent.py`)
Crea una herramienta (`@tool`) que **no realice cambios en BD**, sino que devuelva una acción JSON para el frontend.

```python
@tool
def abrir_nueva_funcionalidad():
    """Abre la pantalla de X."""
    return json.dumps({"action": "open_feature_x"})
```

### 2. Frontend: Capturar la Acción (`hooks/useAudio.js`)
Edita el `socket.on('voice_response')` para interceptar esa acción y lanzar un evento global.

```javascript
} else if (action.action === 'open_feature_x') {
    window.dispatchEvent(new CustomEvent('open_feature_x'));
}
```

### 3. Frontend: Reaccionar en la UI (TuComponente.jsx)
Añade un "listener" en el componente que debe reaccionar.

```javascript
useEffect(() => {
    const handleOpen = () => setModalOpen(true);
    window.addEventListener('open_feature_x', handleOpen);
    return () => window.removeEventListener('open_feature_x', handleOpen);
}, []);
```

### 4. Sincronizar Datos (`stores/interactionStore.js`)
Si la IA debe rellenar datos (como en el formulario):
- El agente usa `update_form` (ya implementado).
- El componente lee `const { formData } = useInteractionStore()`.
- El componente actualiza su estado local cuando `formData` cambia.

---

## 15. Ejemplo Adicional: Desconexión por Voz

Como pidió el usuario, aquí se muestra cómo implementar la función "Cerrar sesión" usando voz, siguiendo el patrón de extensión.

### 15.1. Backend (`agent.py`)
```python
@tool
def logout_user():
    """Cierra la sesión del usuario cuando diga 'salir' o 'cerrar sesión'."""
    return json.dumps({"action": "logout"})
```

### 15.2. Frontend (`hooks/useAudio.js`)
```javascript
} else if (action.action === 'logout') {
    window.dispatchEvent(new CustomEvent('logout_attempt'));
}
```

### 15.3. Frontend Global (`App.jsx`)
Escuchamos el evento en `App.jsx` porque el logout afecta a toda la aplicación.
```javascript
useEffect(() => {
    const handleVoiceLogout = () => {
        logout(); // Función del authStore
        navigate('/login');
    };
    window.addEventListener('logout_attempt', handleVoiceLogout);
    return () => window.removeEventListener('logout_attempt', handleVoiceLogout);
}, []);
```

---

## 16. Pruebas y Verificación

### Paso 1: Crear Usuario Admin Inicial

```python
# create_admin.py
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()

admin = User(
    nombre="Admin",
    email="admin@tienda.com",
    hashed_password=get_password_hash("1234"),
    seccion="general",
    is_admin=1
)

db.add(admin)
db.commit()
print("✅ Usuario admin creado")
db.close()
```

```bash
python create_admin.py
```

### Paso 2: Probar API con cURL

```bash
# Login
curl -X POST http://localhost:8001/auth/login \
  -d "username=admin@tienda.com&password=1234"

# Usar el token recibido
TOKEN="<tu-token-aqui>"

# Crear producto
curl -X POST http://localhost:8001/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Collar de perro",
    "categoria": "accesorios",
    "ubicacion": "Pasillo 3",
    "cantidad": 5
  }'

# Listar productos
curl -X GET http://localhost:8001/products/ \
  -H "Authorization: Bearer $TOKEN"
```

### Paso 3: Probar Integración con Voz

1. Iniciar sesión en la aplicación
2. Ir a la sección de productos
3. Usar el botón de voz y decir: _"Añade 10 collares para perros en el pasillo 3"_
4. Verificar que el producto se crea correctamente

---

## Resumen de Archivos Modificados/Creados

### Backend
- ✅ `database.py` - Configuración de SQLAlchemy
- ✅ `models.py` - Modelos de User y Producto
- ✅ `schemas.py` - Esquemas Pydantic ampliados
- ✅ `auth.py` - Sistema de autenticación JWT
- ✅ `dependencies.py` - Dependencias de autenticación
- ✅ `routers/auth.py` - Endpoints de autenticación
- ✅ `routers/users.py` - CRUD de usuarios
- ✅ `routers/products.py` - CRUD de productos
- ✅ `agent.py` - Herramientas CRUD para IA
- ✅ `main.py` - Integración de routers
- ✅ `.env` - Añadir SECRET_KEY y DATABASE_URL

### Frontend
- ✅ `stores/authStore.js` - Estado de autenticación
- ✅ `api/client.js` - Cliente API con axios
- ✅ `components/Login.jsx` - Componente de login
- ✅ `components/ProductsList.jsx` - Lista de productos
- ✅ `components/ProductForm.jsx` - Formulario de productos
- ✅ `App.jsx` - Routing y protección de rutas

---

## Próximos Pasos Recomendados

1. **Implementar Paginación** en listados
2. **Añadir Búsqueda Avanzada** de productos
3. **Sistema de Roles** más granular (permisos por categoría)
4. **Dashboard con Estadísticas** de productos por categoría
5. **Exportación a Excel/PDF** de inventarios
6. **Sistema de Notificaciones** para productos con stock bajo
7. **Historial de Cambios** (audit log)
8. **Imágenes de Productos** (upload de fotos)

---

**Documento creado:** 2026-02-01  
**Versión:** 1.0  
**Autor:** Sistema de Gestión de Tienda de Mascotas
