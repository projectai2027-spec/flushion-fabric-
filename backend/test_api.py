import httpx
import os

print("Starting API test...")
filename = "test_image.jpg"
# A tiny 1x1 valid minimal jpeg byte string
minimal_jpeg = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xd9'

with open(filename, "wb") as f:
    f.write(minimal_jpeg)

try:
    with open(filename, "rb") as f:
        files = {"file": (filename, f, "image/jpeg")}
    res = httpx.post("https://flushion-fabric.onrender.com/api/generate-prompt", files=files, timeout=30.0)
        print("API Status Code:", res.status_code)
        if res.status_code == 200:
            print("[SUCCESS] Gemini responded:")
            print(res.json().get("suggested_prompt", ""))
        else:
            print("[FAILED] Response:", res.text)
except Exception as e:
    print("Connection error:", e)

if os.path.exists(filename):
    os.remove(filename)
