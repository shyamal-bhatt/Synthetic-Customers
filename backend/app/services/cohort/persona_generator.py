import json
from typing import List
from app.core.logging import get_logger
from app.schemas.study import StudyCohortGenerateRequest, PersonaSchema
from app.prompts import (
    PERSONA_GENERATION_SYSTEM_PROMPT,
    get_persona_generation_user_prompt
)
from app.services.llm import LLMService

logger = get_logger()

# Available Gemini models for fallback sequence
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemini-1.5-flash"
]

class PersonaGenerator:
    """
    Decomposed module responsible for generating high-fidelity cohort personas.
    Handles prompting templates, retry logic, and fallback API sequences.
    """

    def __init__(self, llm_service: LLMService = None):
        self.llm_service = llm_service or LLMService()

    def _call_gemini_with_fallback(self, prompt: str, system_instruction: str = None) -> str:
        """
        Invokes Gemini with sequential fallbacks if rate limits occur.
        """
        last_error = None
        for idx, model in enumerate(GEMINI_MODELS):
            try:
                logger.info(f"[PERSONA GEN] Trying Gemini model: {model} (Attempt {idx+1}/{len(GEMINI_MODELS)})...")
                response = self.llm_service.call_gemini(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model_name=model
                )
                logger.info(f"[PERSONA GEN] Success using Gemini model: {model}")
                return response
            except Exception as e:
                logger.warning(f"[PERSONA GEN] Model {model} failed: {str(e)}")
                last_error = e
        
        logger.error("[PERSONA GEN] All Gemini fallback models exhausted.")
        raise last_error or RuntimeError("All Gemini API models failed.")

    def generate_persona_batch(
        self,
        payload: StudyCohortGenerateRequest,
        cohort_size: int,
        num_to_generate: int,
        start_idx: int,
        end_idx: int,
        mcq_context: str
    ) -> List[PersonaSchema]:
        """
        Executes a single LLM request to generate a sequential slice of personas.
        """
        user_prompt = get_persona_generation_user_prompt(
            product_idea=payload.product_idea,
            audience_description=payload.target_audience,
            cohort_size=cohort_size,
            num_to_generate=num_to_generate,
            start_index=start_idx,
            end_index=end_idx,
            mcq_context=mcq_context
        )

        logger.info(f"[PERSONA GEN] Generating batch of {num_to_generate} personas (indices {start_idx} to {end_idx})...")

        for attempt in range(3):
            try:
                logger.info(f"[PERSONA GEN] Persona batch generation attempt {attempt+1}/3...")
                raw_text = self._call_gemini_with_fallback(
                    prompt=user_prompt,
                    system_instruction=PERSONA_GENERATION_SYSTEM_PROMPT
                )
                parsed_json = json.loads(raw_text)
                
                # Assert list is in "personas" key
                personas_list = parsed_json.get("personas", [])
                if not personas_list:
                    raise ValueError("No personas found in returned JSON envelope.")
                
                validated_personas: List[PersonaSchema] = []
                for p in personas_list:
                    validated_personas.append(PersonaSchema.model_validate(p))
                
                logger.info(f"[PERSONA GEN] Successfully generated and validated {len(validated_personas)} personas in batch.")
                return validated_personas
            except Exception as e:
                logger.warning(f"[PERSONA GEN] Batch generation attempt {attempt+1}/3 failed: {str(e)}")
                if attempt == 2:
                    logger.error("[PERSONA GEN] Persona batch generation failed completely.")
                    raise e
        
        return []
