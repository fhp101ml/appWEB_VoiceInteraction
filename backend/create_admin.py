from database import SessionLocal, engine, Base
from models import User, Producto # Importar todos los modelos para que Base los reconozca
from auth import get_password_hash

def create_admin():
    # Asegurar que las tablas existen
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@tienda.com").first()
        if existing_admin:
            print("⚠️ Admin user already exists")
            # Update password if exists to ensure it is 1234 as requested
            existing_admin.hashed_password = get_password_hash("1234")
            db.commit()
            print("🔑 Password updated to '1234'")
            return

        admin = User(
            nombre="Admin Tienda",
            email="admin@tienda.com",
            hashed_password=get_password_hash("1234"),
            role="admin",
            is_admin=1,
            is_active=1
        )

        db.add(admin)
        db.commit()
        print("✅ Admin user created successfully")
        print("📧 Email: admin@tienda.com")
        print("🔑 Password: 1234")
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
