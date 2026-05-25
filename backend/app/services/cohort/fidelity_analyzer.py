import json
from typing import List, Any
from app.core.logging import get_logger
from app.services.llm import LLMService
from app.schemas.study import (
    StudyCohortGenerateRequest,
    PersonaSchema,
    PersonaFeedbackSchema,
    FidelityAssessmentSchema
)
from app.prompts.fidelity_assessment import get_fidelity_assessment_user_prompt, FIDELITY_ASSESSMENT_SYSTEM_PROMPT

logger = get_logger()

class FidelityAnalyzer:
    """
    Service responsible for conducting a blind fidelity assessment on generated personas and feedback.
    """

    def __init__(self, llm_service: LLMService = None):
        self.llm_service = llm_service or LLMService()

    def analyze_fidelity(
        self,
        payload: Any,
        personas: List[PersonaSchema],
        feedbacks: List[PersonaFeedbackSchema]
    ) -> FidelityAssessmentSchema:
        """
        Runs the fidelity assessment prompt against the generated data to evaluate realism and diversity.
        """
        logger.info("[FIDELITY ANALYZER] Starting fidelity assessment...")

        persona_dicts = [p.model_dump(by_alias=False) for p in personas]
        feedback_dicts = [f.model_dump(by_alias=False) for f in feedbacks]

        user_prompt = get_fidelity_assessment_user_prompt(
            product_idea=payload.product_idea,
            audience_description=payload.target_audience,
            personas_array=persona_dicts,
            feedback_array=feedback_dicts
        )

        logger.debug(f"[FIDELITY ANALYZER] Prompt length: {len(user_prompt)} chars")

        try:
            # We want strict JSON back matching FidelityAssessmentSchema
            raw_response = self.llm_service.call_gemini(
                system_instruction=FIDELITY_ASSESSMENT_SYSTEM_PROMPT,
                prompt=user_prompt
            )
            
            logger.info("[FIDELITY ANALYZER] Successfully generated fidelity assessment.")
            
            if isinstance(raw_response, dict):
                return FidelityAssessmentSchema(**raw_response)
            elif isinstance(raw_response, str):
                cleaned = raw_response.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                
                start_idx = cleaned.find("{")
                end_idx = cleaned.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    cleaned = cleaned[start_idx:end_idx+1]
                    
                return FidelityAssessmentSchema(**json.loads(cleaned.strip()))
            else:
                return raw_response
                
        except Exception as e:
            logger.error(f"[FIDELITY ANALYZER] Failed to generate fidelity assessment: {str(e)}", exc_info=True)
            # Return a fallback object so the pipeline doesn't break
            return self._get_fallback_fidelity()

    def _get_fallback_fidelity(self) -> FidelityAssessmentSchema:
        fallback_json = {
            "dimensions": {
                "score_variance": {"score": 0, "evidence": "Failed to calculate."},
                "profile_coherence": {"score": 0, "evidence": "Failed to calculate."},
                "objection_diversity": {"score": 0, "evidence": "Failed to calculate."},
                "ocean_alignment": {"score": 0, "evidence": "Failed to calculate."},
                "persona_distinctiveness": {"score": 0, "evidence": "Failed to calculate."}
            },
            "final_score": 0,
            "label": "unreliable",
            "primary_weakness": "evaluation_failed",
            "improvement_note": "The fidelity assessment failed to run. Please check the logs."
        }
        return FidelityAssessmentSchema(**fallback_json)
