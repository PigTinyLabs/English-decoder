import os
import subprocess

IPA_SYMBOLS = [
    # Vowels
    "iː", "ɪ", "e", "æ", "ɑː", "ɒ", "ɔː", "ʊ", "uː", "ʌ", "ɜː", "ə",
    # Diphthongs
    "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "ɪə", "eə", "ʊə",
    # Consonants
    "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z",
    "ʃ", "ʒ", "tʃ", "dʒ", "m", "n", "ŋ", "l", "r", "ɹ", "j", "w", "h"
]

IPA_TO_ESPEAK = {
    "iː": "i:", "ɪ": "I", "e": "e", "æ": "a", "ɑː": "A:", "ɒ": "Q",
    "ɔː": "O:", "ʊ": "U", "uː": "u:", "ʌ": "V", "ɜː": "3:", "ə": "@",
    "eɪ": "eI", "aɪ": "aI", "ɔɪ": "OI", "aʊ": "aU", "əʊ": "@U",
    "ɪə": "I@", "eə": "e@", "ʊə": "U@",
    "p": "p", "b": "b@", "t": "t", "d": "d@", "k": "k", "g": "g@",
    "f": "f", "v": "v", "θ": "T", "ð": "D", "s": "s", "z": "z",
    "ʃ": "S", "ʒ": "Z", "tʃ": "tS", "dʒ": "dZ",
    "m": "m", "n": "n", "ŋ": "N", "l": "l", "r": "r@", "ɹ": "r@",
    "j": "j", "w": "w", "h": "h"
}

for sym in IPA_SYMBOLS:
    espeak_sym = IPA_TO_ESPEAK.get(sym, sym)
    wav_file = f"audio/{sym}.wav"
    mp3_file = f"audio/{sym}.mp3"
    
    subprocess.run(["espeak", "-v", "en-us", "-w", wav_file, f"[[{espeak_sym}]]"])
    
    # Check if wav is almost empty
    size = os.path.getsize(wav_file)
    if size < 1000:
        print(f"Warning: {sym} ({espeak_sym}) produced empty wav!")
    
    subprocess.run(["ffmpeg", "-y", "-i", wav_file, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_file],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(wav_file)

print("Regeneration complete.")
