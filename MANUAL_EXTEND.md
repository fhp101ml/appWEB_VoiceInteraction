# Manual de Extensión: Sistema de Gestión de Tienda de Mascotas

Este manual describe cómo extender la funcionalidad de la aplicación base. La arquitectura está diseñada en torno a 4 pilares:
1.  **Herramienta Back-End (Agent)**
2.  **Evento Front-End (Socket/Audio)**
3.  **UI/Componente React**
4.  **Estado Global (Store)**

---

## 🏗️ 1. Añadir una Nueva Funcionalidad (Ejemplo: "Gestión de Eventos")

### Paso 1: Backend - Definir la Herramienta
En `backend/agent.py`, define la herramienta que el agente usará.

```python
@tool
def crear_evento(nombre: str, fecha: str):
    """
    Crea un nuevo evento en el calendario.
    Args:
        nombre: Título del evento.
        fecha: Fecha en formato YYYY-MM-DD.
    """
    # Lógica de base de datos aquí...
    return json.dumps({
        "action": "evento_creado",
        "nombre": nombre
    })
```
*No olvides añadirla a la lista `self.tools`.*

### Paso 2: Frontend - Escuchar el Evento Global
En `frontend/src/hooks/useAudio.js`, captura la acción del agente y emite un evento del navegador.

```javascript
} else if (action.action === 'evento_creado') {
    window.dispatchEvent(new CustomEvent('evento_creado', { detail: action }));
}
```

### Paso 3: Componente - Reaccionar al Evento
En tu componente (ej: `EventsManager.jsx`), escucha el evento.

```javascript
useEffect(() => {
    const handleEvento = (e) => {
        alert(`Evento creado: ${e.detail.nombre}`);
        // Recargar datos...
    };
    window.addEventListener('evento_creado', handleEvento);
    return () => window.removeEventListener('evento_creado', handleEvento);
}, []);
```

---

## 🎨 2. Personalizar el Tema
El diseño visual se controla en `frontend/src/index.css` mediante variables CSS.

```css
:root {
  /* Colores Principales */
  --primary: #FF7E5F; 
  --secondary: #FEB47B;
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);
}
```
Para cambiar la identidad de "Tienda de Mascotas" a otra cosa (ej: "Inventario Médico"), cambia estos colores y el logo en `App.jsx`.

---

## 🗣️ 3. Añadir Nuevos Comandos de Voz
Los comandos no se "programan" rígidamente, se **describen** en el Prompt del Sistema (`backend/agent.py`).

```python
self.system_prompt = """
...
CAPACIDADES:
- Gestión de Productos (Crear, Listar...)
- Gestión de Eventos (NUEVO)

FLUJO:
- Si el usuario dice "Agendar reunión", usa la herramienta `crear_evento`.
"""
El LLM entenderá la intención y ejecutará la herramienta adecuada.
