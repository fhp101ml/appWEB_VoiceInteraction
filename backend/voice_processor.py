import os
import tempfile
import base64
import asyncio
from openai import AsyncOpenAI
import edge_tts
from dotenv import load_dotenv

load_dotenv()

class VoiceProcessor:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        
        # Lazy load whisper only if needed to save startup time
        self.local_whisper_model = None

    async def stt(self, audio_bytes: bytes) -> str:
        """Converts audio to text using OpenAI Whisper with Local Fallback."""
        if not self.client: 
            print("STT: No API Key, forcing local Whisper.")
            return await self.stt_local(audio_bytes)
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp:
            temp.write(audio_bytes)
            temp_path = temp.name
            
        try:
            # Try API First
            with open(temp_path, "rb") as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file,
                    language="es"
                )
            return transcript.text
        except Exception as e:
            print(f"STT API Error: {e}. Falling back to Local Whisper...")
            return await self.stt_local(audio_bytes, temp_path)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    async def stt_local(self, audio_bytes: bytes, temp_path: str = None) -> str:
        """Local Whisper fallback."""
        try:
            import whisper
            
            if not temp_path:
                with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp:
                    temp.write(audio_bytes)
                    temp_path = temp.name
            
            # Lazy load model (using 'base' as it's fast)
            if not self.local_whisper_model:
                print("Loading local whisper model 'base'...")
                self.local_whisper_model = whisper.load_model("base")
            
            result = self.local_whisper_model.transcribe(temp_path, language="es")
            return result["text"]
        except Exception as local_e:
            print(f"Local STT Error: {local_e}")
            return ""
        finally:
            if not temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    async def tts(self, text: str) -> bytes:
        """Converts text to audio using OpenAI (High Quality) or Edge-TTS (Fallback)."""
        if self.client:
            try:
                # Use OpenAI TTS
                response = await self.client.audio.speech.create(
                    model="tts-1",
                    voice="nova",
                    input=text
                )
                return response.content
            except Exception as e:
                print(f"OpenAI TTS Failed, falling back to Edge: {e}")
        
        # Fallback to Edge TTS (Free, decent quality)
        try:
            communicate = edge_tts.Communicate(text, "es-ES-AlvaroNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data
        except Exception as e:
            print(f"Edge TTS Failed: {e}")
            return b""
