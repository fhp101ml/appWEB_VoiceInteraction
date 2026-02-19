# Pet Shop Assistant Module

This is a standalone module providing a multimodal (Voice + Chat + GUI) interaction template using Python (FastAPI/LangGraph) and React (Vite/Socket.IO).

## Structure
- `/backend`: Python FastAPI server with LangGraph agent and Voice processing.
- `/frontend`: React Vite application with Voice/Chat UI components.

## 📦 Demo Application: Pet Shop Inventory Manager

Included in this template is a **fully functional demo application** for a Pet Shop Inventory Management System. 

This serves as a **real-world example** of how to build interactive voice-enabled apps. It includes:
- **Authentication**: Secure login (Voice & GUI).
- **CRUD Operations**: Create, Read, Update, Delete products.
- **Voice Forms**: Open, fill, and close forms using natural language.
- **Real-time Sync**: Updates across all clients instantly.

**Adaptable**: This demo is designed to be easily adapted to any other context.

## 🚀 Installation Guide

### 1. Backend Setup

Prerequisites: Python 3.10+ installed.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (`venv`):
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: You may need `ffmpeg` installed on your system for audio processing.*

5. Create a `.env` file in `backend/` with your API Key:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

6. Run the server:
   ```bash
   python main.py
   ```
   *The server will start on `http://localhost:8001`*

### 2. Frontend Setup

Prerequisites: Node.js (v18+) and npm installed.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   *The app will start on `http://localhost:5174`*

---

## 🎮 Usage

1. Open the frontend in your browser.
2. Accept browser microphone permissions.
3. **Voice**: Click the Microphone icon and say:
   - "Quiero entrar con el usuario xxxx@xxxx.com y la contraseña xxxx"
   - "Quiero registrar un nuevo producto"
   - "Es comida para gatos de la categoría alimentación"
4. **Keyboard Shortcut**: Hold <kbd>↓</kbd> (Down Arrow) to speak without clicking.
5. **Chat**: Type "Añadir producto" in the chat box.
6. **Form**: Watch the form update in real-time based on your voice/chat commands.

