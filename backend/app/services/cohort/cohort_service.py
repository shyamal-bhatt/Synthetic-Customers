from typing import List, Tuple, Any
from app.core.logging import get_logger
from app.schemas.study import (
    StudyCohortGenerateRequest,
    StudyCohortGenerateResponse,
    PersonaSchema,
    PersonaFeedbackSchema
)
from app.services.llm import LLMService
from app.services.cohort.persona_generator import PersonaGenerator
from app.services.cohort.feedback_simulator import FeedbackSimulator
from app.services.cohort.synthesis_analyzer import SynthesisAnalyzer
from app.services.cohort.fidelity_analyzer import FidelityAnalyzer
from app.db.repositories import StudyRepository

logger = get_logger()

class CohortService:
    """
    Orchestrates the dynamic high-fidelity persona generation, feedback simulation, 
    and statistics synthesis. Acts as the primary Orchestrator Facade for customer simulations.
    """

    def __init__(
        self, 
        llm_service: LLMService = None,
        persona_generator: PersonaGenerator = None,
        feedback_simulator: FeedbackSimulator = None,
        synthesis_analyzer: SynthesisAnalyzer = None,
        fidelity_analyzer: FidelityAnalyzer = None
    ):
        self.llm_service = llm_service or LLMService()
        self.persona_generator = persona_generator or PersonaGenerator(self.llm_service)
        self.feedback_simulator = feedback_simulator or FeedbackSimulator(self.llm_service)
        self.synthesis_analyzer = synthesis_analyzer or SynthesisAnalyzer(self.llm_service)
        self.fidelity_analyzer = fidelity_analyzer or FidelityAnalyzer(self.llm_service)

    def _format_mcq_context(self, request: StudyCohortGenerateRequest) -> str:
        """
        Formats all dynamic MCQ questions and the researcher's selected answers into a context string.
        """
        mcq_details_list = []
        for q in request.mcq_form.questions:
            selected_opt_id = request.mcq_answers.get(q.id)
            selected_label = "TBD"
            if selected_opt_id:
                opt = next((opt for opt in q.options if opt.id == selected_opt_id), None)
                if opt:
                    selected_label = opt.label
            mcq_details_list.append(f"- {q.question}: {selected_label}")
        return "\n".join(mcq_details_list)

    def generate_personas(
        self,
        payload: StudyCohortGenerateRequest,
        study_id: str
    ) -> List[PersonaSchema]:
        """
        Phase 1: Generates high-fidelity customer personas from MCQ responses.
        """
        logger.info("==================================================")
        logger.info(f"[COHORT SERVICE] Phase 1: Generating personas for Study ID: {study_id}...")
        logger.info("==================================================")

        # 1. Resolve researcher MCQ answers to text labels
        mcq_context = self._format_mcq_context(payload)

        # 2. Persona Generation (Split into 2 parts if N > 12)
        personas: List[PersonaSchema] = []
        n = payload.cohort_size
        
        if n <= 12:
            logger.info(f"[COHORT SERVICE] Cohort size {n} <= 12. Triggering single persona generation batch...")
            personas.extend(self.persona_generator.generate_persona_batch(
                payload, n, n, 1, n, mcq_context
            ))
        else:
            logger.info(f"[COHORT SERVICE] Cohort size {n} > 12. Splitting persona generation into 2 parallel batches...")
            mid = n // 2
            personas.extend(self.persona_generator.generate_persona_batch(
                payload, n, mid, 1, mid, mcq_context
            ))
            personas.extend(self.persona_generator.generate_persona_batch(
                payload, n, n - mid, mid + 1, n, mcq_context
            ))

        import uuid
        for p in personas:
            p.id = str(uuid.uuid4())

        logger.info(f"[COHORT SERVICE] Successfully generated {len(personas)} distinct personas.")
        
        # Persist to database
        StudyRepository.save_study_config(study_id, payload)
        StudyRepository.save_personas(study_id, personas)
        
        return personas

    def generate_feedback_and_synthesis(
        self,
        payload: StudyCohortGenerateRequest,  # Accepts either StudyCohortGenerateRequest or StudyFeedbackGenerateRequest since they share fields
        study_id: str = None
    ) -> Tuple[List[PersonaFeedbackSchema], Any]:
        """
        Phase 2: Runs parallel feedback simulation and synthesizes global insights.
        """
        logger.info("==================================================")
        logger.info(f"[COHORT SERVICE] Phase 2: Running feedback loop and synthesis...")
        logger.info("==================================================")

        # 3. Parallel Simulator Feedback Loop
        feedbacks = self.feedback_simulator.run_feedback_loop(
            payload=payload,
            personas=payload.personas
        )

        # 4. Statistical Analysis & Synthesis
        synthesis_obj = self.synthesis_analyzer.analyze_and_synthesize(
            payload=payload,
            personas=payload.personas,
            feedbacks=feedbacks
        )

        # 5. Fidelity Assessment
        fidelity_obj = self.fidelity_analyzer.analyze_fidelity(
            payload=payload,
            personas=payload.personas,
            feedbacks=feedbacks
        )
        synthesis_obj.fidelity = fidelity_obj

        logger.info("==================================================")
        logger.info(f"[COHORT SERVICE] Phase 2: Feedback & synthesis simulation completed successfully!")
        logger.info("==================================================")
        
        # Persist to database if study_id is provided
        if study_id:
            StudyRepository.save_feedback(study_id, feedbacks)
            StudyRepository.save_synthesis(study_id, synthesis_obj)

        return feedbacks, synthesis_obj

    def generate_cohort(
        self,
        payload: StudyCohortGenerateRequest,
        study_id: str
    ) -> StudyCohortGenerateResponse:
        """
        Legacy main orchestration facade method to run the synthetic customer study simulation all at once.
        """
        from app.schemas.study import StudyFeedbackGenerateRequest

        personas = self.generate_personas(payload, study_id)
        
        feedback_payload = StudyFeedbackGenerateRequest(
            projectName=payload.project_name,
            productIdea=payload.product_idea,
            targetAudience=payload.target_audience,
            mcqAnswers=payload.mcq_answers,
            mcqForm=payload.mcq_form,
            personas=personas
        )

        feedbacks, synthesis_obj = self.generate_feedback_and_synthesis(feedback_payload, study_id=study_id)

        return StudyCohortGenerateResponse(
            status="success",
            studyId=study_id,
            personas=personas,
            feedback=feedbacks,
            synthesis=synthesis_obj
        )

