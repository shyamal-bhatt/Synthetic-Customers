from fastapi import APIRouter
from app.api.v1.endpoints import hello, study, chat

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(hello.router, prefix="/hello", tags=["hello"])
api_router.include_router(study.router, prefix="/study", tags=["study"])
api_router.include_router(chat.router, prefix="/personas", tags=["chat"])
