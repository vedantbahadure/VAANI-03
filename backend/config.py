"""Environment-driven settings. No hardcoded secrets or paths."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Data lives OUTSIDE the reload-watched backend dir (writes would trigger uvicorn reloads).
DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(exist_ok=True)

CHROMA_DIR = DATA_DIR / "chroma"
SQLITE_PATH = DATA_DIR / "vaani.db"

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

VAANI_MODE = os.environ.get("VAANI_MODE", "showcase")        # showcase | device
VAANI_HARDWARE = os.environ.get("VAANI_HARDWARE", "mock")    # mock | laptop | raspberry_pi | esp32

# Models
LLM_PROVIDER = "gemini"
LLM_MODEL = "gemini-3.1-pro-preview"
STT_MODEL = "whisper-1"
TTS_MODEL = "tts-1-hd"
TTS_VOICE = "nova"
TTS_SPEED = 0.96

# RAG params
RAG_TOP_K = 5
RAG_SCORE_THRESHOLD = 0.28   # cosine similarity gate for grounded answers
CHUNK_SIZE = 900
CHUNK_OVERLAP = 140

SUPPORTED_LANGS = {"en": "English", "hi": "हिन्दी", "mr": "मराठी"}
KB_COLLECTION = "vaani_kb"
