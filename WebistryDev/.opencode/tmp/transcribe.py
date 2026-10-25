import av
import numpy as np
import sys

def ogg_to_whisper_array(path):
    """Decode Ogg Vorbis to mono 16kHz float32 numpy array."""
    container = av.open(path)
    stream = container.streams.audio[0]
    # resample to 16k mono
    resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
    chunks = []
    for frame in container.decode(stream):
        frame.pts = None
        for out in resampler.resample(frame):
            arr = out.to_ndarray()  # shape (channels, samples) or (samples,)
            chunks.append(arr.squeeze())
    # flush
    for out in resampler.resample(None):
        arr = out.to_ndarray()
        chunks.append(arr.squeeze())
    if not chunks:
        return None
    audio = np.concatenate(chunks)
    # to float32 in [-1, 1]
    if audio.dtype == np.int16:
        audio = audio.astype(np.float32) / 32768.0
    return audio

files = [
    r"C:\Users\sheri\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\6B434FF263015AAEA9D64A850F48725A2273B598\transfers\2026-41\WhatsApp Ptt 2026-10-13 at 01.01.52.ogg",
    r"C:\Users\sheri\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\6B434FF263015AAEA9D64A850F48725A2273B598\transfers\2026-41\WhatsApp Ptt 2026-10-13 at 01.02.33.ogg",
]

from faster_whisper import WhisperModel

# tiny model, CPU int8 -> fast
model = WhisperModel("small", device="cpu", compute_type="int8")

for f in files:
    name = f.split("\\")[-1]
    print("=" * 70)
    print("FILE:", name)
    audio = ogg_to_whisper_array(f)
    if audio is None:
        print("  !! could not decode")
        continue
    print("  duration_s:", round(len(audio) / 16000, 2))
    segments, info = model.transcribe(audio, language="en", vad_filter=True)
    print("  detected_language:", info.language, "prob", round(info.language_probability, 2))
    for seg in segments:
        print(f"  [{seg.start:6.2f} -> {seg.end:6.2f}] {seg.text.strip()}")
print("=" * 70)
print("DONE")
