import os
import uuid
import PIL.Image
import io
from dotenv import load_dotenv

# Env variables load karne ke liye
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
import google.generativeai as genai
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL or "sqlite:///./test.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# AB ISKE NICHE AGAR PURANA DATABASE KA CODE HAI TOH USE DELETE KAR DO
# Phir aapka FastAPI app shuru hoga:
app = FastAPI()
import models
import schemas
import database
import services

# --- DATABASE CONNECTION FIX START ---
# Render ka Environment Variable uthayega
DATABASE_URL = os.getenv("DATABASE_URL")

# Render/Postgres fix: postgres:// ko postgresql:// mein badalna zaroori hai
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Agar Render URL nahi milta toh testing ke liye local sqlite banayega
engine = create_engine(DATABASE_URL or "sqlite:///./test.db")
database.engine = engine # database file ke engine ko override kar rahe hain
models.Base.metadata.create_all(bind=engine)
# --- DATABASE CONNECTION FIX END ---

app = FastAPI(title="Flushion Fabric AI")

# CORS Settings: Sabhi origins allow hain taaki Vercel se "Failed to fetch" na aaye
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key configuration
api_key = "AIzaSyCEncRlgjq3Tv5k8AQOv9ne1Wmpc2XBORM"
genai.configure(api_key=api_key)

@app.get("/")
async def root():
    return {"status": "Online", "message": "Flushion Fabric Backend is Running"}

@app.post("/api/generate-prompt", response_model=schemas.GeneratePromptResponse)
async def generate_prompt(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    fabric_id = str(uuid.uuid4())
    
    try:
        content = await file.read()
        image_data = PIL.Image.open(io.BytesIO(content))

        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = (
            "Analyze this fabric. Output a highly descriptive prompt for image generation, "
            "focus on texture, material, and pattern style. "
            "The output should be a single paragraph optimized for AI image generators."
        )
        
        response = model.generate_content([prompt, image_data])
        
        if not response.text:
            raise Exception("Gemini could not generate text for this image.")

        return {"suggested_prompt": response.text, "fabric_id": fabric_id}
        
    except Exception as e:
        print(f"Backend Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

@app.post("/api/learn-prompt")
def learn_prompt(req: schemas.LearnPromptRequest, db: Session = Depends(database.get_db)):
    record = models.FabricPrompt(**req.dict())
    db.add(record)
    db.commit()
    return {"status": "success", "message": "Learned successfully!"}

@app.post("/api/generate-final-image", response_model=schemas.GenerateFinalResponse)
async def generate_final_image(req: schemas.GenerateFinalRequest):
    try:
        img_url = await services.generate_final_image(req.prompt, req.fabric_base64)
        return {"image_url": img_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation Error: {str(e)}")

@app.post("/api/generate-alternates", response_model=schemas.GenerateAlternatesResponse)
async def generate_alternates(req: schemas.GenerateAlternatesRequest):
    try:
        styles = await services.generate_alternates(req.prompt, req.fabric_base64)
        return {"styles": styles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
