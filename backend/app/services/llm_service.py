import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger()

class LLMService:
    """
    Dedicated layer for making API calls to LLM providers.
    Currently integrates with Google AI Studio (Gemini 2.5 Flash).
    """

    def call_gemini(self, prompt: str) -> str:
        """
        Executes an HTTP POST to Google AI Studio to call Gemini 2.5 Flash.
        Accepts a fully formed prompt string, handles the raw HTTP transport,
        and extracts/returns the raw generated text response.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("[LLM SERVICE] GEMINI_API_KEY is not defined in backend settings!")
            raise ValueError("GEMINI_API_KEY is missing from environment. Please add it to backend/.env")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        logger.info("[LLM SERVICE] Calling Google AI Studio Gemini API endpoint...")
        # Make synchronous request via httpx
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload)
            
        if response.status_code != 200:
            logger.error(f"[LLM SERVICE] Gemini API request failed (HTTP {response.status_code}): {response.text}")
            raise ValueError(f"Google AI Studio Gemini API returned status code {response.status_code}")
            
        response_json = response.json()
        
        # Extract response from candidates envelope
        try:
            generated_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            logger.debug("[LLM SERVICE] Extracted text from response envelope successfully.")
            return generated_text
        except (KeyError, IndexError) as e:
            logger.error(f"[LLM SERVICE] Failed to extract text from candidates envelope: {str(e)}")
            logger.debug(f"[LLM SERVICE] Raw response structure: {response_json}")
            raise ValueError("Malformed response structure returned from Gemini API envelope")
