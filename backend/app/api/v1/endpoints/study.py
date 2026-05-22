from fastapi import APIRouter, Depends, HTTPException, status
from app.core.logging import get_logger
from app.schemas.study import StudyInitializeRequest, StudyInitializeResponse
from app.services.study_service import StudyService

router = APIRouter()
logger = get_logger()

# Dependency Injection for StudyService
def get_study_service() -> StudyService:
    return StudyService()


@router.post(
    "/initialize",
    response_model=StudyInitializeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize Study Framework",
    description="Receives target audience, product idea, and cohort size, validates them, and initializes a new research study."
)
def initialize_study(
    payload: StudyInitializeRequest,
    service: StudyService = Depends(get_study_service)
) -> StudyInitializeResponse:
    """
    HTTP Controller for study initialization.
    Responsible for validating requests, handling HTTP errors, and executing service logic.
    """
    logger.info("==================================================")
    logger.info(f"[HTTP] POST request received at /api/v1/study/initialize")
    logger.info("==================================================")
    
    try:
        # Pass control directly to the business logic service
        result = service.initialize_study(payload)
        
        logger.info(f"[HTTP] Successfully prepared response payload (HTTP 201 Created).")
        logger.info("==================================================")
        return result
        
    except Exception as e:
        logger.error(f"[HTTP] Error encountered during study initialization: {str(e)}", exc_info=True)
        logger.info("==================================================")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize study framework: {str(e)}"
        )
