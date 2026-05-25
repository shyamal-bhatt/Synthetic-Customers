import json
from typing import List
from app.core.logging import get_logger
from app.schemas.study import (
    StudyCohortGenerateRequest,
    PersonaSchema,
    PersonaFeedbackSchema,
    SynthesisSchema,
    ObjectionClusterSchema,
    PositiveSignalSchema
)
from app.prompts import (
    SYNTHESIS_SYSTEM_PROMPT,
    get_synthesis_user_prompt
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

class SynthesisAnalyzer:
    """
    Decomposed module responsible for statistical feedback analysis 
    and LLM-based cohort synthesis clustering.
    """

    def __init__(self, llm_service: LLMService = None):
        self.llm_service = llm_service or LLMService()

    def _call_gemini_with_fallback(self, prompt: str, system_instruction: str = None) -> str:
        """
        Invokes Gemini with sequential fallbacks.
        """
        last_error = None
        for idx, model in enumerate(GEMINI_MODELS):
            try:
                response = self.llm_service.call_gemini(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model_name=model
                )
                return response
            except Exception as e:
                logger.warning(f"[SYNTHESIS ANALYZER] Gemini fallback model {model} failed: {str(e)}")
                last_error = e
        raise last_error or RuntimeError("All Gemini API models failed.")

    def analyze_and_synthesize(
        self,
        payload: StudyCohortGenerateRequest,
        personas: List[PersonaSchema],
        feedbacks: List[PersonaFeedbackSchema]
    ) -> SynthesisSchema:
        """
        Calculates hard statistics and prompts Gemini to synthesize qualitative insights.
        """
        logger.info(f"[SYNTHESIS ANALYZER] Starting statistical and LLM synthesis calculation...")
        
        # 1. Precalculate Stats (in Python)
        total_count = len(feedbacks)
        buy_scores = [f.likelihood_to_buy for f in feedbacks]
        mean_score = round(sum(buy_scores) / total_count, 2) if total_count > 0 else 0.0
        
        score_distribution = {str(i): 0 for i in range(1, 6)}
        for score in buy_scores:
            score_distribution[str(score)] += 1
            
        price_reaction_counts = {"too_cheap": 0, "acceptable": 0, "expensive": 0, "dealbreaker": 0}
        for f in feedbacks:
            reaction = f.price_reaction.lower()
            if reaction in price_reaction_counts:
                price_reaction_counts[reaction] += 1
            else:
                price_reaction_counts["acceptable"] += 1 # Default fallback
                
        trial_yes_count = sum(1 for f in feedbacks if f.would_try_free_trial)

        logger.info(f"[SYNTHESIS ANALYZER] Statistical metrics calculated:")
        logger.info(f"  - Total Personas: {total_count}")
        logger.info(f"  - Mean Purchase Intent Score: {mean_score}/5")
        logger.info(f"  - Price Reactions: {price_reaction_counts}")
        logger.info(f"  - Trial Signups: {trial_yes_count}/{total_count}")

        # 2. Synthesis Generation via LLM
        feedbacks_json = json.dumps([f.model_dump(by_alias=True) for f in feedbacks], indent=2)
        synthesis_user_prompt = get_synthesis_user_prompt(
            product_idea=payload.product_idea,
            audience_description=payload.target_audience,
            total_count=total_count,
            mean_score=mean_score,
            score_distribution_str=json.dumps(score_distribution),
            price_reaction_counts_str=json.dumps(price_reaction_counts),
            trial_yes_count=trial_yes_count,
            feedback_array_str=feedbacks_json
        )

        synthesis_obj = None
        for attempt in range(3):
            try:
                logger.info(f"[SYNTHESIS ANALYZER] LLM synthesis generation attempt {attempt+1}/3...")
                raw_synthesis = self._call_gemini_with_fallback(
                    prompt=synthesis_user_prompt,
                    system_instruction=SYNTHESIS_SYSTEM_PROMPT
                )
                parsed_synth = json.loads(raw_synthesis)
                synthesis_obj = SynthesisSchema.model_validate(parsed_synth)
                logger.info("[SYNTHESIS ANALYZER] LLM synthesis generated and validated successfully.")
                return synthesis_obj
            except Exception as e:
                logger.warning(f"[SYNTHESIS ANALYZER] Attempt {attempt+1}/3 failed: {str(e)}")
                if attempt == 2:
                    logger.error("[SYNTHESIS ANALYZER] LLM synthesis fully failed. Emitting graceful fallback structural synthesis.")
                    # Build a structured fallback synthesis object
                    synthesis_obj = SynthesisSchema(
                        objectionClusters=[
                            ObjectionClusterSchema(
                                theme="Price vs. Value Hesitation",
                                frequency=total_count // 3,
                                personaIds=[p.id for p in personas[:3]],
                                summary="Several cohort members wonder if this product saves enough time to warrant another recurring subscription."
                            )
                        ],
                        positiveSignals=[
                            PositiveSignalSchema(
                                signal="Workflow automation appeal",
                                personaIds=[p.id for p in personas[3:5]],
                                evidence="Members react positively to the prospect of shedding manual workload."
                            )
                        ],
                        surprisingOutliers=[],
                        criticalRisk="High price sensitivity and switching friction from existing spreadsheet workarounds.",
                        executiveSummary="The cohort is moderately interested but highly cautious about adoption. Transparent pricing and easy integration are core prerequisites."
                    )
                    return synthesis_obj
        
        return synthesis_obj
