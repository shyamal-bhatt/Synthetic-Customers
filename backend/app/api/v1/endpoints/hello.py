from fastapi import APIRouter
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger()

@router.get("", response_model=dict)
def get_hello():
    logger.info("Hello World endpoint was hit")
    return {
        "message": "Hello World from FastAPI Backend!",
        "status": "active"
    }
