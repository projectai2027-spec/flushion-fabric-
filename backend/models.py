from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base

class StyleGeneration(Base):
    __tablename__ = "style_generations"

    id = Column(Integer, primary_key=True, index=True)
    fabric_texture = Column(String, index=True)
    fabric_pattern = Column(String)
    garment_type = Column(String, index=True)
    image_url = Column(String)
    prompt_used = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(Integer, primary_key=True, index=True)
    generation_id = Column(Integer, ForeignKey("style_generations.id"))
    is_accepted = Column(Boolean)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
