import subprocess
import os

from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="English Decoder - Local eSpeak Server")

# Cho phép gọi từ file:// (origin "null") và từ localhost bất kỳ port nào
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bảng ánh xạ IPA -> ký hiệu phoneme nội bộ của eSpeak (đặt trong [[ ]])
IPA_TO_ESPEAK = {
    # Vowels
    "iː": "i:", "ɪ": "I", "e": "e", "æ": "a", "ɑː": "A:", "ɒ": "Q",
    "ɔː": "O:", "ʊ": "U", "uː": "u:", "ʌ": "V", "ɜː": "3:", "ə": "@",
    # Diphthongs
    "eɪ": "eI", "aɪ": "aI", "ɔɪ": "OI", "aʊ": "aU", "əʊ": "@U",
    "ɪə": "I@", "eə": "e@", "ʊə": "U@",
    # Consonants
    "p": "p", "b": "b@", "t": "t", "d": "d@", "k": "k", "g": "g@",
    "f": "f", "v": "v", "θ": "T", "ð": "D", "s": "s", "z": "z",
    "ʃ": "S", "ʒ": "Z", "tʃ": "tS", "dʒ": "dZ",
    "m": "m", "n": "n", "ŋ": "N", "l": "l", "r": "r@", "ɹ": "r@",
    "j": "j", "w": "w", "h": "h"
}

@app.get("/speak-ipa")
def speak_ipa(sym: str = Query(..., description="Ký tự IPA cần phát âm")):
    """
    Nhận ký tự IPA, gọi eSpeak-NG xuất ra file WAV và trả về dạng audio/wav
    """
    espeak_sym = IPA_TO_ESPEAK.get(sym, sym)
    
    # Tạo file WAV tạm
    temp_wav = "temp_ipa.wav"
    subprocess.run(["espeak", "-v", "en-us", "-w", temp_wav, f"[[{espeak_sym}]]"])
    
    try:
        with open(temp_wav, "rb") as f:
            audio_data = f.read()
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            
    return Response(content=audio_data, media_type="audio/wav")

@app.get("/speak-word")
def speak_word(text: str = Query(..., description="Từ cần phát âm")):
    """
    Phát âm một từ nguyên vẹn (sử dụng khả năng G2P của espeak)
    """
    temp_wav = "temp_word.wav"
    subprocess.run(["espeak", "-v", "en-us", "-w", temp_wav, text])
    
    try:
        with open(temp_wav, "rb") as f:
            audio_data = f.read()
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            
    return Response(content=audio_data, media_type="audio/wav")

@app.get("/symbols")
def get_symbols():
    return {"supported_symbols": list(IPA_TO_ESPEAK.keys())}

# Chạy: uvicorn server:app --port 8008 --reload
