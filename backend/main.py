import os
import uuid
import pathlib
import PIL.Image # Standard Python Image Lib required per official Gemini docs
from dotenv import load_dotenv

# Ensure environmental keys are picked up securely
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import google.generativeai as genai

import models
import schemas
import database
import services

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Flushion Fabric AI")

# CRITICAL RULES Applied: CORS Enabled internally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rule: Load API key using os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY'))

@app.post("/api/generate-prompt", response_model=schemas.GeneratePromptResponse)
async def generate_prompt(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    """
    Rewritten from scratch logic for Gemini 1.5 Flash natively utilizing google.generativeai
    """
    fabric_id = str(uuid.uuid4())
    file_location = f"./temp/{file.filename}"
    os.makedirs("./temp", exist_ok=True)
    
    # Save the file temporarily
    with open(file_location, "wb+") as f:
        f.write(file.file.read())

    try:
        # Load image via PIL.Image for native python SDK support
        image_data = PIL.Image.open(file_location)

        # Rule: Set model = genai.GenerativeModel('gemini-1.5-flash')
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = "Analyze this fabric. Output a highly descriptive prompt for image generation, focusing on texture, material, and pattern style."
        
        # Rule: Use response = model.generate_content([prompt, image_data])
        response = model.generate_content([prompt, image_data])
        
        return {"suggested_prompt": response.text, "fabric_id": fabric_id}
    except Exception as e:
        print("Backend Generation Error:", str(e))
        raise HTTPException(status_code=500, detail=f"Google SDK Error: {str(e)}")

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

# CRITICAL RULES Applied: Use if __name__ == "__main__": to wrap uvicorn.run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
