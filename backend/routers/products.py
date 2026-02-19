from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Producto, User, CategoriaEnum
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
        try:
            cat_enum = CategoriaEnum(categoria.lower())
            query = query.filter(Producto.categoria == cat_enum)
        except ValueError:
            pass # Ignore invalid category filter
            
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
