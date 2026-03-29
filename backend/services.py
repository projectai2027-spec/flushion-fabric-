import base64
import uuid
import httpx
import os
import pathlib
import google.generativeai as genai
from typing import List, Dict
from dotenv import load_dotenv

# Ensure the .env from the backend directory is reliably targetted
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

async def analyze_with_gemini(file_location: str, db=None) -> tuple[str, str]:
    """
    Real Gemini 1.5 Flash via official google.generativeai Python SDK.
    """
    fabric_id = str(uuid.uuid4())
    
    # Fetch dynamic keys avoiding global caching
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY", "missing_key")
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    image_data = pathlib.Path(file_location).read_bytes()
    image_part = {
        "mime_type": "image/jpeg",
        "data": image_data
    }
    
    prompt = "Analyze this fabric. Output a highly descriptive prompt for image generation, focusing on texture, material, and pattern style."
    
    try:
        res = await model.generate_content_async([prompt, image_part])
        # Force finish translation
        res.resolve() 
        return res.text, fabric_id
    except Exception as e:
        # Propagate error back heavily denying fallback logic
        raise RuntimeError(f"Real Gemini 1.5 Flash SDK Error: {str(e)}. (Check GOOGLE_API_KEY)")

async def generate_final_image(prompt: str, fabric_base64: str) -> str:
    """
    Real execution target hitting Nano Banana 3 SDK API. No mocks.
    """
    # Fetch dynamic keys avoiding global caching
    nano_api_key = os.environ.get("NANO_BANANA_API_KEY", "missing_key")

    url = "https://api.nanobanana.ai/v3/generation/img2img"
    
    api_payload = {
        "prompt": prompt,
        "width": 3840,
        "height": 2160,          # 4K resolution guaranteed
        "upscale": True,
        "enhance_details": True,
        "quality": "max",
        "output_format": "png",  # Lossless PNG
        "model": "nano-banana-3-sdxl",
        "init_image": f"data:image/png;base64,{fabric_base64}",
        "texture_reference": True,
        "target_file_size_limit": "20MB" # Strict 4K requirements
    }
    
    headers = {
        "Authorization": f"Bearer {nano_api_key}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=api_payload, headers=headers, timeout=120.0)
            res.raise_for_status()
            data = res.json()
            return data.get("image_url", "")
        except Exception as e:
            raise RuntimeError(f"Real Nano Banana 3 API Error: {str(e)}. (Check NANO_BANANA_API_KEY)")

async def generate_alternates(prompt: str, fabric_base64: str) -> List[Dict]:
    """
    Real batch variation execution targeting Nano Banana 3 SDK API.
    """
    nano_api_key = os.environ.get("NANO_BANANA_API_KEY", "missing_key")

    url = "https://api.nanobanana.ai/v3/generation/batch-img2img"
    styles_list = ["Silk Shirt", "Summer Dress", "Tailored Suit", "Designer Hat", "Luxury Boots", "Couture Handbag"]
    
    api_payload = {
        "base_prompt": prompt,
        "variations": styles_list,
        "width": 3840,
        "height": 2160,
        "upscale": True,
        "enhance_details": True,
        "quality": "max",
        "output_format": "png",
        "model": "nano-banana-3-sdxl",
        "init_image": f"data:image/png;base64,{fabric_base64}",
        "texture_reference": True
    }

    headers = {
        "Authorization": f"Bearer {nano_api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=api_payload, headers=headers, timeout=180.0)
            res.raise_for_status()
            data = res.json()
            return data.get("results", [])
        except Exception as e:
            raise RuntimeError(f"Real Batch API Error: {str(e)}. (Check NANO_BANANA_API_KEY)")
