from fastapi import APIRouter, Depends, HTTPException, status, Header
from app.core.logging import get_logger
from app.schemas.study import (
    StudyInitializeRequest,
    StudyInitializeResponse,
    StudyCohortGenerateRequest,
    StudyCohortGenerateResponse,
    StudyPersonasGenerateResponse,
    StudyFeedbackGenerateRequest,
    StudyFeedbackGenerateResponse,
    TargetAudienceGenerateRequest,
    TargetAudienceGenerateResponse
)
from app.services.study_service import StudyService
from app.services.cohort_service import CohortService
from app.db.repositories import StudyRepository
from typing import List, Dict, Any

router = APIRouter()
logger = get_logger()

# Dependency Injection for StudyService
def get_study_service() -> StudyService:
    return StudyService()

# Dependency Injection for CohortService
def get_cohort_service() -> CohortService:
    return CohortService()

@router.post(
    "/initialize",
    response_model=StudyInitializeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize Study Framework"
)
def initialize_study(
    payload: StudyInitializeRequest,
    service: StudyService = Depends(get_study_service)
) -> StudyInitializeResponse:
    try:
        return service.initialize_study(payload)
    except Exception as e:
        logger.error(f"[HTTP] Error encountered during study initialization: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize study framework: {str(e)}"
        )

@router.post(
    "/generate-target-audience",
    response_model=TargetAudienceGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Target Audience"
)
def generate_target_audience(
    payload: TargetAudienceGenerateRequest,
    service: StudyService = Depends(get_study_service)
) -> TargetAudienceGenerateResponse:
    try:
        return service.generate_target_audience(payload)
    except Exception as e:
        logger.error(f"[HTTP] Error generating target audience: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate target audience: {str(e)}"
        )

@router.post(
    "/generate-personas",
    response_model=StudyPersonasGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Personas"
)
def generate_personas(
    payload: StudyCohortGenerateRequest,
    service: CohortService = Depends(get_cohort_service)
) -> StudyPersonasGenerateResponse:
    try:
        personas = service.generate_personas(payload, study_id=payload.study_id)
        return StudyPersonasGenerateResponse(
            status="success",
            studyId=payload.study_id,
            personas=personas
        )
    except Exception as e:
        logger.error(f"[HTTP] Error generating personas for {payload.study_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate personas: {str(e)}"
        )

@router.post(
    "/generate-feedback",
    response_model=StudyFeedbackGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Persona Feedback and Synthesis"
)
def generate_feedback(
    payload: StudyFeedbackGenerateRequest,
    service: CohortService = Depends(get_cohort_service)
) -> StudyFeedbackGenerateResponse:
    try:
        feedback, synthesis_obj = service.generate_feedback_and_synthesis(payload, study_id=payload.study_id)
        return StudyFeedbackGenerateResponse(
            status="success",
            feedback=feedback,
            synthesis=synthesis_obj
        )
    except Exception as e:
        logger.error(f"[HTTP] Error simulating feedback/synthesis for {payload.study_id}: {str(e)}", exc_info=True)
        # Avoid passing raw string that might contain braces which FastAPI or Pydantic might accidentally format
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to simulate feedback and synthesis."
        )

@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get Study History"
)
def get_study_history():
    try:
        return StudyRepository.get_studies()
    except Exception as e:
        logger.error(f"[HTTP] Error fetching history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch study history"
        )

@router.get(
    "/{study_id}",
    status_code=status.HTTP_200_OK,
    summary="Get Study Details"
)
def get_study_details(study_id: str):
    try:
        study = StudyRepository.get_study_details(study_id)
        if not study:
            raise HTTPException(status_code=404, detail="Study not found")
        return study
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[HTTP] Error fetching details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch study details"
        )

@router.delete(
    "/{study_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Study"
)
def delete_study(study_id: str):
    try:
        success = StudyRepository.delete_study(study_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete study")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[HTTP] Error deleting: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete study"
        )
