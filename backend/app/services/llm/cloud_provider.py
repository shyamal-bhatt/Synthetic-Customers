import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger()

class CloudLLMProvider:
    """
    Handles all external Cloud LLM API interactions (Google Gemini & Groq).
    """

    def call_gemini(self, prompt: str, system_instruction: str = None, model_name: str = "gemini-2.5-flash") -> str:
        """
        Executes an HTTP POST to Google AI Studio to call Gemini models with dynamic fallbacks and system instructions.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("[CLOUD LLM] GEMINI_API_KEY is not defined in backend settings!")
            raise ValueError("GEMINI_API_KEY is missing from environment. Please add it to backend/.env")

        fallback_chain = [
            model_name,
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-3-flash",
            "gemini-1.5-flash"
        ]
        
        # Remove duplicates while preserving order
        models_to_try = []
        for m in fallback_chain:
            if m not in models_to_try:
                models_to_try.append(m)

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
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [
                    {
                        "text": system_instruction
                    }
                ]
            }

        last_error = None
        
        with httpx.Client(timeout=45.0) as client:
            for current_model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={api_key}"
                logger.info(f"[CLOUD LLM] Calling Google AI Studio Gemini API endpoint with model: {current_model}...")
                
                try:
                    response = client.post(url, json=payload)
                    
                    if response.status_code == 200:
                        response_json = response.json()
                        try:
                            generated_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
                            logger.debug(f"[CLOUD LLM] Extracted text from {current_model} response successfully.")
                            return generated_text
                        except (KeyError, IndexError) as e:
                            logger.error(f"[CLOUD LLM] Failed to extract text from candidates envelope ({current_model}): {str(e)}")
                            logger.debug(f"[CLOUD LLM] Raw response structure: {response_json}")
                            # Malformed response is a hard failure, but we could choose to fallback. We'll raise it.
                            raise ValueError("Malformed response structure returned from Gemini API envelope")
                    else:
                        logger.warning(f"[CLOUD LLM] Gemini API request failed for {current_model} (HTTP {response.status_code}): {response.text}")
                        last_error = ValueError(f"Google AI Studio Gemini API returned status code {response.status_code}")
                except httpx.RequestError as e:
                    logger.warning(f"[CLOUD LLM] Network error for {current_model}: {str(e)}")
                    last_error = e
                    
        logger.error("[CLOUD LLM] All models in the fallback chain failed.")
        raise last_error or ValueError("All models in the fallback chain failed.")

    def call_groq(self, prompt: str, system_instruction: str = None, model_name: str = "llama-3.1-8b-instant") -> str:
        """
        Executes an API call using the official Groq client libraries.
        Returns the parsed message content as JSON.
        """
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.error("[CLOUD LLM] GROQ_API_KEY is not defined in backend settings!")
            raise ValueError("GROQ_API_KEY is missing from environment. Please add it to backend/.env")

        from groq import Groq
        
        logger.info(f"[CLOUD LLM] Calling Groq API with model: {model_name}...")
        client = Groq(api_key=api_key)
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        try:
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model_name,
                response_format={"type": "json_object"}
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"[CLOUD LLM] Groq API call failed: {str(e)}")
            raise e
