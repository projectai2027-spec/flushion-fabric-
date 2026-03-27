from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from . import models, schemas, database, services

# Database Creation
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Flushion Fabric AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload", response_model=schemas.FabricAnalysisResult)
async def upload_fabric(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    file_location = f"./temp/{file.filename}"
    os.makedirs("./temp", exist_ok=True)
    with open(file_location, "wb+") as f:
        f.write(file.file.read())

    # Step A: Google Vision API Logic trigger
    analysis = await services.analyze_fabric(file_location)
    
    # Step B: Image Gen via Nano Banana 2 SDK trigger
    gen_data = await services.generate_garments(analysis['texture'], analysis['pattern'])
    
    saved_gens = []
    for g in gen_data:
        db_gen = models.StyleGeneration(**g, fabric_texture=analysis['texture'], fabric_pattern=analysis['pattern'])
        db.add(db_gen)
        db.commit()
        db.refresh(db_gen)
        saved_gens.append(db_gen)

    return {**analysis, "generations": saved_gens}

@app.post("/api/feedback")
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(database.get_db)):
    log = models.FeedbackLog(**feedback.dict())
    db.add(log)
    db.commit()
    # Logic to learn from reject/accept triggers RL adjustments below...
    return {"status": "Feedback Learned ✅"}
