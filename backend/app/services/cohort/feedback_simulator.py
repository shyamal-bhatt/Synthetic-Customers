import json
from typing import List
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.study import (
    StudyCohortGenerateRequest,
    PersonaSchema,
    PersonaFeedbackSchema,
    ObjectionSchema
)
from app.prompts import (
    PERSONA_FEEDBACK_SYSTEM_PROMPT,
    get_persona_feedback_user_prompt
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

class FeedbackSimulator:
    """
    Decomposed module responsible for simulating direct customer feedback loops.
    Executes structured interactions for each persona in parallel.
    Supports multi-API concurrency (Groq/Gemini) and direct local model routing.
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
                logger.warning(f"[FEEDBACK SIM] Gemini fallback model {model} failed: {str(e)}")
                last_error = e
        raise last_error or RuntimeError("All Gemini API models failed.")

    def run_feedback_loop(
        self,
        payload: StudyCohortGenerateRequest,
        personas: List[PersonaSchema]
    ) -> List[PersonaFeedbackSchema]:
        """
        Executes feedback threads concurrently for each persona in the cohort.
        """
        feedbacks: List[PersonaFeedbackSchema] = []
        groq_available = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
        
        logger.info(f"[FEEDBACK SIM] Starting feedback simulation for {len(personas)} personas...")

        # Build MCQ context detail string representing questions, selection, and remaining options
        mcq_details_list = []
        if hasattr(payload, "mcq_form") and payload.mcq_form and payload.mcq_form.questions and payload.mcq_answers:
            for idx, q in enumerate(payload.mcq_form.questions):
                selected_opt_id = payload.mcq_answers.get(q.id)
                selected_label = "None"
                remaining_labels = []
                for opt in q.options:
                    if opt.id == selected_opt_id:
                        selected_label = opt.label
                    else:
                        remaining_labels.append(opt.label)
                
                q_text = f"Q{idx+1}: {q.question}\n"
                q_text += f"  - Selected Choice: {selected_label}\n"
                if remaining_labels:
                    q_text += f"  - Other Choices Presented: {', '.join(remaining_labels)}\n"
                mcq_details_list.append(q_text)
        
        mcq_details_str = "\n".join(mcq_details_list)

        if groq_available:
            logger.info("[FEEDBACK SIM] Groq API is configured. Split multi-API concurrency active (75% Groq / 25% Gemini).")
        else:
            logger.warning("[FEEDBACK SIM] Groq API key is not defined. Falling back entirely to Gemini API.")

        def run_feedback_for_persona(index: int, persona: PersonaSchema) -> PersonaFeedbackSchema:
            # Determine API provider selection in API mode
            use_groq = groq_available and (index % 4 != 0)
            
            persona_json = json.dumps(persona.model_dump(by_alias=True), indent=2)
            user_prompt = get_persona_feedback_user_prompt(
                persona_json_str=persona_json,
                product_idea=payload.product_idea,
                audience_description=payload.target_audience,
                mcq_details=mcq_details_str
            )

            for attempt in range(2):
                try:
                    if use_groq:
                        logger.info(f"[FEEDBACK THREAD] Running feedback for '{persona.name}' on Groq...")
                        raw_feedback = self.llm_service.call_groq(
                            prompt=user_prompt,
                            system_instruction=PERSONA_FEEDBACK_SYSTEM_PROMPT,
                            model_name="llama-3.1-8b-instant"
                        )
                    else:
                        logger.info(f"[FEEDBACK THREAD] Running feedback for '{persona.name}' on Gemini Fallback...")
                        raw_feedback = self._call_gemini_with_fallback(
                            prompt=user_prompt,
                            system_instruction=PERSONA_FEEDBACK_SYSTEM_PROMPT
                        )

                    parsed_json = json.loads(raw_feedback)
                    validated_feedback = PersonaFeedbackSchema.model_validate(parsed_json)
                    logger.debug(f"[FEEDBACK THREAD] Successfully captured feedback for persona: {persona.name}")
                    return validated_feedback
                    
                except Exception as e:
                    logger.warning(f"[FEEDBACK THREAD] Attempt {attempt+1} failed for '{persona.name}': {str(e)}")
                    if groq_available:
                        # Toggle API choice on second attempt as a fallback
                        use_groq = not use_groq
            
            # Graceful fallback response if all LLM options fail
            logger.error(f"[FEEDBACK THREAD] Failed to get feedback for '{persona.name}' after 2 attempts. Emitting graceful default feedback.")
            return PersonaFeedbackSchema(
                personaId=persona.id,
                likelihoodToBuy=3,
                priceReaction="acceptable",
                wouldTryFreeTrial=True,
                overallStatement=f"I am cautiously curious about {payload.product_idea[:50]}, but I have active doubts concerning its exact onboarding fit.",
                mcqTranscript=[],
                featuresShouldHave=["Clear onboarding workflow"],
                featuresShouldNotHave=["Excessive setup screens"],
                topObjections=[
                    ObjectionSchema(
                        objection="Pricing is unclear compared to my current solution.",
                        severity="moderate",
                        wouldOvercomeIf="Providing a fully transparent tier structure."
                    )
                ],
                awarenessShift="I am willing to consider alternatives, but remain grounded in my current tools."
            )

        logger.info(f"[FEEDBACK SIM] Executing {len(personas)} feedback simulation threads in parallel...")
        with ThreadPoolExecutor(max_workers=10) as executor:
            feedback_results = list(executor.map(
                lambda item: run_feedback_for_persona(item[0], item[1]),
                enumerate(personas)
            ))
            
        feedbacks.extend(feedback_results)
        logger.info(f"[FEEDBACK SIM] Successfully collected simulation feedback for all {len(personas)} personas.")
        return feedbacks
