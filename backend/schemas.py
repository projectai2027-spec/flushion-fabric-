from pydantic import BaseModel
from typing import List, Optional

class GeneratePromptResponse(BaseModel):
    suggested_prompt: str
    fabric_id: str

class LearnPromptRequest(BaseModel):
    fabric_id: str
    original_prompt: str
    edited_prompt: str
    user_instructions: Optional[str] = "None"
    fabric_features: Optional[str] = "Auto-extracted"

class GenerateFinalRequest(BaseModel):
    prompt: str
    fabric_base64: str

class GenerateFinalResponse(BaseModel):
    image_url: str

class AlternateStyle(BaseModel):
    item: str
    image_url: str

class GenerateAlternatesRequest(BaseModel):
    prompt: str
    fabric_base64: str

class GenerateAlternatesResponse(BaseModel):
    styles: List[AlternateStyle]
