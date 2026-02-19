import json
import os
from typing import Dict, List, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.callbacks import BaseCallbackHandler

# Database imports
from database import SessionLocal
from models import Producto, User as UserModel, CategoriaEnum

# Callback to capture actions separately from text response
class ActionCaptureCallback(BaseCallbackHandler):
    def __init__(self):
        self.actions = []
    
    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        try:
            # Handle both string and ToolMessage object
            output_str = output.content if hasattr(output, 'content') else str(output)
            data = json.loads(output_str)
            if isinstance(data, dict) and "action" in data:
                self.actions.append(data)
        except Exception:
            pass

class InteractionAgent:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("WARNING: No OPENAI_API_KEY found. Agent will not work.")
            return

        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=self.api_key)
        self.memory = MemorySaver()
        
        # --- DEFINING TOOLS ---
        
        @tool
        def update_form(field: str, value: str):
            """
            Updates a field in the form.
            Args:
                field: The name of the field (e.g., 'name', 'email', 'comments').
                value: The value to set.
            """
            return json.dumps({
                "action": "update_form", 
                "field": field.lower(), 
                "value": value
            })

        @tool
        def submit_form():
            """
            Submits the current form.
            Use this when the user says "submit", "send", "I'm done", etc.
            """
            return json.dumps({
                "action": "submit_form"
            })
        
        # ===== PRODUCTOS CRUD TOOLS =====
        
        @tool
        def crear_producto(
            nombre: str, 
            categoria: str, 
            ubicacion: str, 
            cantidad: int = 1,
            descripcion: str = ""
        ):
            """
            Crea un nuevo producto en la base de datos de la tienda.
            Args:
                nombre: Nombre del producto (ej: "Pienso perro adulto")
                categoria: Categoría (alimentacion, juguetes, accesorios, salud, higiene, otros)
                ubicacion: Ubicación física (ej: "Estantería A1", "Almacén")
                cantidad: Cantidad de stock (por defecto 1)
                descripcion: Descripción opcional del producto
            """
            try:
                db = SessionLocal()
                # Validar categoría
                try:
                    categoria_enum = CategoriaEnum(categoria.lower())
                except ValueError:
                    # Intento de corrección o default a OTROS si falla
                    categoria_enum = CategoriaEnum.OTROS
                
                new_producto = Producto(
                    nombre=nombre,
                    descripcion=descripcion,
                    categoria=categoria_enum,
                    ubicacion=ubicacion,
                    cantidad=cantidad,
                    registrado_por=1  # Usuario del sistema por voz
                )
                
                db.add(new_producto)
                db.commit()
                db.refresh(new_producto)
                
                return json.dumps({
                    "action": "producto_created",
                    "product_id": new_producto.id,
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
                categoria: Categoría para filtrar (alimentacion, juguetes, etc.)
            """
            try:
                db = SessionLocal()
                query = db.query(Producto)
                
                if categoria:
                    try:
                        categoria_enum = CategoriaEnum(categoria.lower())
                        query = query.filter(Producto.categoria == categoria_enum)
                    except ValueError:
                        pass # Ignorar filtro si es inválido
                
                productos = query.limit(10).all()
                
                result = {
                    "action": "products_listed",
                    "count": len(productos),
                    "products": [
                        {
                            "id": p.id,
                            "nombre": p.nombre,
                            "categoria": p.categoria.value,
                            "ubicacion": p.ubicacion,
                            "cantidad": p.cantidad
                        }
                        for p in productos
                    ]
                }
                
                return json.dumps(result)
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        @tool
        def actualizar_producto(producto_id: int, campo: str, nuevo_valor: str):
            """
            Actualiza un campo de un producto.
            Args:
                producto_id: ID del producto a actualizar
                campo: Campo a modificar (nombre, ubicacion, cantidad, categoria)
                nuevo_valor: Nuevo valor para el campo
            """
            try:
                db = SessionLocal()
                producto = db.query(Producto).filter(Producto.id == producto_id).first()
                
                if not producto:
                    return json.dumps({"action": "error", "message": "Producto no encontrado"})
                
                if campo == "cantidad":
                    producto.cantidad = int(nuevo_valor)
                elif campo == "categoria":
                    producto.categoria = CategoriaEnum(nuevo_valor.lower())
                elif campo in ["nombre", "ubicacion", "descripcion"]:
                    setattr(producto, campo, nuevo_valor)
                
                db.commit()
                
                return json.dumps({
                    "action": "product_updated",
                    "product_id": producto_id,
                    "campo": campo
                })
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
        
        @tool
        def eliminar_producto(producto_id: int):
            """
            Elimina un producto de la base de datos.
            Args:
                producto_id: ID del producto a eliminar
            """
            try:
                db = SessionLocal()
                producto = db.query(Producto).filter(Producto.id == producto_id).first()
                
                if not producto:
                    return json.dumps({"action": "error", "message": "Producto no encontrado"})
                
                nombre = producto.nombre
                db.delete(producto)
                db.commit()
                
                return json.dumps({
                    "action": "product_deleted",
                    "product_id": producto_id,
                    "nombre": nombre
                })
            except Exception as e:
                return json.dumps({"action": "error", "message": str(e)})
            finally:
                db.close()
            
        @tool
        def abrir_formulario_producto():
            """
            Abre el formulario de creación de producto en la interfaz visual.
            Úsalo cuando el usuario exprese intención de añadir o registrar un nuevo producto.
            """
            return json.dumps({
                "action": "open_product_form"
            })

        @tool
        def cerrar_formulario_producto():
            """
            Cierra el formulario de creación de producto.
            Úsalo cuando el usuario quiera cancelar.
            """
            return json.dumps({
                "action": "close_product_form"
            })

        @tool
        def login_user(email: str, password: str):
            """
            Inicia sesión en el sistema.
            Args:
                email: Correo electrónico del usuario.
                password: Contraseña del usuario.
            """
            return json.dumps({
                "action": "login",
                "email": email,
                "password": password
            })

        @tool
        def logout_user():
            """
            Cierra la sesión del usuario actual.
            """
            return json.dumps({
                "action": "logout"
            })

        self.tools = [
            update_form, 
            submit_form,
            crear_producto,
            listar_productos,
            actualizar_producto,
            eliminar_producto,
            abrir_formulario_producto,
            cerrar_formulario_producto,
            login_user,
            logout_user
        ]
        
        self.system_prompt = """Eres un asistente de voz experto para la gestión de una Tienda de Mascotas (Pet Shop).

CAPACIDADES:
1. Gestión Visual:
   - `abrir_formulario_producto`: Ábrelo cuando el usuario quiera añadir o actualizar un  producto al inventario.
   - `cerrar_formulario_producto`: Ciérralo si el usuario cancela.
   - `update_form`: Úsalo para rellenar campos del formulario (nombre, categoria, ubicacion, cantidad) mientras el usuario dicta.

2. Gestión de Datos (Persistencia):
   - `crear_producto`: Úsalo SOLO cuando tengas TODOS los datos necesarios y el usuario confirme guardar.
   - `listar_productos`, `actualizar_producto`, `eliminar_producto`: Para gestionar el inventario existente.

3. Gestión de Sesión:
   - `login_user`: Si el usuario pide entrar o loguearse (ej: "entrar como admin").
   - `logout_user`: Si el usuario pide salir o cerrar sesión.

FLUJO DE CREACIÓN INTERACTIVA:
1. Usuario: "Quiero añadir un producto". -> Acción: `abrir_formulario_producto`.
2. Usuario: "Es un saco de pienso Royal Canin". -> Acción: `update_form("nombre", "Pienso Royal Canin")`.
3. Usuario: "Es para la sección de alimentación". -> Acción: `update_form("categoria", "alimentacion")`.
...
4. Usuario: "Guardar". -> Acción: `crear_producto(...)`.

CATEGORÍAS DE TIENDA:
- alimentacion, juguetes, accesorios, salud, higiene, otros.

INSTRUCCIONES:
- Responde de forma amable y profesional, como un encargado de tienda eficiente.
- Si abres el formulario, indícalo verbalmente.
- Ve confirmando los datos que rellenas.
- Si el usuario quiere salir, ejecuta `logout_user()` y despídete.
"""

        self.agent_graph = create_react_agent(
            self.llm, 
            self.tools, 
            prompt=self.system_prompt,
            checkpointer=self.memory
        )

    async def process_input(self, session_id: str, text: str, context: Dict = None) -> Dict:
        """
        Process user text input and return text response + actions.
        """
        if not self.api_key:
            return {"text": "Error: OpenAI API Key missing.", "actions": []}

        full_input = f"{text}\nContext: {json.dumps(context) if context else '{}'}"
        action_callback = ActionCaptureCallback()
        
        try:
            inputs = {"messages": [HumanMessage(content=full_input)]}
            config = {
                "configurable": {"thread_id": session_id},
                "callbacks": [action_callback]
            }
            
            result = await self.agent_graph.ainvoke(inputs, config=config)
            
            # Extract final text response
            response_text = "No entendí eso."
            if result["messages"]:
                response_text = result["messages"][-1].content
                
            return {
                "text": response_text,
                "actions": action_callback.actions
            }
            
        except Exception as e:
            print(f"Agent Error: {e}")
            return {"text": "Lo siento, encontré un error.", "actions": []}
