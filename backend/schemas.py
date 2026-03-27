from pydantic import BaseModel
from typing import List

class FeedbackCreate(BaseModel):
    generation_id: int
    is_accepted: bool

class GenerationResult(BaseModel):
    id: int
    garment_type: str
    image_url: str
    prompt_used: str

class FabricAnalysisResult(BaseModel):
    texture: str
    pattern: str
    drape: str
    generations: List[GenerationResult]
