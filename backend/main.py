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
app = FastAPI(title="Pet Shop  Inventory API")

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
try:
    voice_processor = VoiceProcessor()
    agent = InteractionAgent()
    print("✅ Pet Shop Inventory System Initialized")
except Exception as e:
    print(f"❌ Error Initializing Components: {e}")

@app.get("/")
async def root():
    return {"message": "Pet Shop Inventory API", "version": "2.0.0"}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('connection_ack', {'sid': sid}, to=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def voice_input(sid, data):
    """
    Handle incoming voice data (audio blob) or text override.
    data: { 'audio': <bytes/None>, 'text': <str/None>, 'context': <dict> }
    """
    audio_data = data.get('audio')
    text_input = data.get('text')
    context = data.get('context', {})

    print(f"[VOICE] Input from {sid}")

    # 1. STT (if audio provided)
    user_text = text_input
    if audio_data:
        # If passed as list/bytearray from JS, convert to bytes
        if isinstance(audio_data, list):
            audio_data = bytes(audio_data)
        user_text = await voice_processor.stt(audio_data)
    
    if not user_text:
        await sio.emit('error', {'message': 'Could not understand audio'}, to=sid)
        return

    print(f"[VOICE] Transcribed: {user_text}")

    # 2. Process with Agent
    # Pass session_id (sid) for memory
    agent_result = await agent.process_input(sid, user_text, context)
    response_text = agent_result["text"]
    actions = agent_result["actions"]

    print(f"[AGENT] Response: {response_text}")
    print(f"[AGENT] Actions: {actions}")

    # 3. TTS
    audio_response_bytes = await voice_processor.tts(response_text)
    audio_base64 = base64.b64encode(audio_response_bytes).decode('utf-8') if audio_response_bytes else None
    
    # 4. Emit Response
    await sio.emit('voice_response', {
        'text': response_text,
        'audio': audio_base64, 
        'user_text': user_text,
        'actions': actions
    }, to=sid)

@sio.event
async def chat_message(sid, data):
    """
    Handle text chat messages.
    data: { 'message': <str>, 'context': <dict> }
    """
    user_text = data.get('message')
    context = data.get('context', {})
    
    print(f"[CHAT] Message from {sid}: {user_text}")
    
    # Process with Agent
    agent_result = await agent.process_input(sid, user_text, context)
    
    # Emit back response
    await sio.emit('chat_response', {
        'text': agent_result["text"],
        'actions': agent_result["actions"]
    }, to=sid)

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8001, reload=True)
