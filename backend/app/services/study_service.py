import json
import uuid
import threading
from typing import Dict, Any, Tuple

from app.core.logging import get_logger
from app.schemas.study import StudyInitializeRequest, StudyInitializeResponse, StudyMCQSchema
from app.prompts import get_study_mcq_prompt
from app.services.llm_service import LLMService

logger = get_logger()

# Thread-safe in-memory cache for idempotency
# Cache key: (product_idea, target_audience, cohort_size)
_cache_lock = threading.Lock()
_cached_studies: Dict[Tuple[str, str, int], StudyInitializeResponse] = {}

class StudyService:
    """
    Business logic layer for handling all operations related to research studies.
    Integrates with Google AI Studio (Gemini 2.5 Flash) via LLMService to dynamically 
    build custom clarify questionnaires, and utilizes thread-safe caching to ensure idempotency.
    """

    def __init__(self, llm_service: LLMService = None):
        self.llm_service = llm_service or LLMService()

    def initialize_study(self, payload: StudyInitializeRequest) -> StudyInitializeResponse:
        logger.info("--------------------------------------------------")
        logger.info("[STUDY SERVICE] Starting study initialization workflow...")
        logger.info("--------------------------------------------------")
        
        # Normalization for cache check
        norm_idea = payload.product_idea.strip()
        norm_audience = payload.target_audience.strip()
        norm_size = payload.cohort_size
        cache_key = (norm_idea, norm_audience, norm_size)
        
        # Idempotence Check
        with _cache_lock:
            if cache_key in _cached_studies:
                cached_res = _cached_studies[cache_key]
                logger.info(f"[STUDY SERVICE] Idempotence HIT: Identical configuration already initialized. Returning cached Study ID: {cached_res.study_id}")
                logger.info("--------------------------------------------------")
                return cached_res

        logger.debug(f"[STUDY SERVICE] Incoming parameters received:")
        logger.debug(f"  - Product Idea (raw len): {len(payload.product_idea)} chars")
        logger.debug(f"  - Target Audience: '{payload.target_audience}'")
        logger.debug(f"  - Cohort Size: {payload.cohort_size} personas")

        # Generate Dynamic Questions via Gemini API with retry loop
        max_retries = 2
        mcq_form = None
        
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"[STUDY SERVICE] MCQ Generation Attempt {attempt + 1} of {max_retries + 1}...")
                
                # 1. Retrieve the isolated prompt template
                prompt = get_study_mcq_prompt(norm_idea, norm_audience)
                
                # 2. Call the LLM Service
                raw_text = self.llm_service.call_gemini(prompt)
                
                # 3. Try parsing raw JSON response
                parsed_json = json.loads(raw_text)
                
                # 4. Validate with Pydantic schema
                mcq_form = StudyMCQSchema.model_validate(parsed_json)
                
                logger.info("[STUDY SERVICE] Successfully parsed and validated dynamic MCQ form structure.")
                break  # Successful generation, exit the loop
            except Exception as e:
                logger.warning(f"[STUDY SERVICE] Attempt {attempt + 1} encountered generation/parsing error: {str(e)}")
                if attempt == max_retries:
                    logger.error("[STUDY SERVICE] All 3 generation attempts failed. Propagating error.")
                    raise ValueError(f"Failed to generate structured MCQ form after {max_retries + 1} attempts: {str(e)}")

        # Create study session ID
        generated_id = str(uuid.uuid4())
        logger.info(f"[STUDY SERVICE] Unique study session generated -> Study ID: {generated_id}")

        # Process cohort sizing strategy
        logger.info(f"[STUDY SERVICE] Determining persona generation strategy for size {payload.cohort_size}...")
        if payload.cohort_size <= 20:
            logger.info("[STUDY SERVICE] Selected Sizing Strategy: Standard Focus Group mode (optimized for high depth).")
        elif payload.cohort_size <= 50:
            logger.info("[STUDY SERVICE] Selected Sizing Strategy: Medium Market Segment mode (balanced depth & breadth).")
        else:
            logger.info("[STUDY SERVICE] Selected Sizing Strategy: Large Statistical Cohort mode (optimized for high coverage).")

        # Compile finalized study metadata response
        response = StudyInitializeResponse(
            status="success",
            message="Study framework initialized successfully on the FastAPI backend",
            study_id=generated_id,
            config=payload,
            mcqForm=mcq_form  # Note: Pydantic automatically serializes aliases
        )

        # Cache response for idempotency
        with _cache_lock:
            _cached_studies[cache_key] = response
            logger.info(f"[STUDY SERVICE] Study ID {generated_id} stored in cache for idempotency.")

        logger.info(f"[STUDY SERVICE] Study initialization completed successfully for Study ID: {generated_id}")
        logger.info("--------------------------------------------------")
        
        return response
