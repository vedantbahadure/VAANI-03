"""LLM (Gemini 3.1 Pro), STT (Whisper), TTS (OpenAI) adapters via Emergent Universal Key."""
import io
from typing import AsyncIterator, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
from config import EMERGENT_LLM_KEY, LLM_PROVIDER, LLM_MODEL, STT_MODEL, TTS_MODEL, TTS_VOICE, TTS_SPEED


class GeminiLLM:
    async def stream(self, system: str, prompt: str, session_id: str) -> AsyncIterator[str]:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system
        ).with_model(LLM_PROVIDER, LLM_MODEL)
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                yield event.content
            elif isinstance(event, StreamDone):
                break

    async def complete(self, system: str, prompt: str) -> str:
        import uuid
        parts = []
        async for delta in self.stream(system, prompt, session_id=str(uuid.uuid4())):
            parts.append(delta)
        return "".join(parts)


class WhisperSTT:
    def __init__(self):
        self._stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)

    async def transcribe(self, audio_bytes: bytes, filename: str, language: Optional[str]) -> str:
        buf = io.BytesIO(audio_bytes)
        buf.name = filename or "audio.webm"
        kwargs = {"file": buf, "model": STT_MODEL, "response_format": "json"}
        if language:
            kwargs["language"] = language
        resp = await self._stt.transcribe(**kwargs)
        return getattr(resp, "text", "") or ""


class OpenAITTS:
    """OpenAI TTS via emergentintegrations. Warm, natural female voice (nova) at a calm cadence."""
    def __init__(self):
        self._tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

    async def synthesize(self, text: str, voice: str = TTS_VOICE, speed: float = TTS_SPEED) -> bytes:
        return await self._tts.generate_speech(
            text=text[:4000], model=TTS_MODEL, voice=voice or TTS_VOICE,
            speed=speed, response_format="mp3"
        )


_llm = GeminiLLM()
_stt: Optional[WhisperSTT] = None
_tts = OpenAITTS()


def get_llm() -> GeminiLLM:
    return _llm


def get_stt() -> WhisperSTT:
    global _stt
    if _stt is None:
        _stt = WhisperSTT()
    return _stt


def get_tts() -> OpenAITTS:
    return _tts
