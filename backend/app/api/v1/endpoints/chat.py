from fastapi import APIRouter, Depends, Header, Query
from app.schemas.chat import ChatRequest, ChatResponse, ConversationHistoryResponse
from app.services.chat_service import chat_with_persona, get_conversation_history

router = APIRouter()

@router.get("/{persona_id}/conversation", response_model=ConversationHistoryResponse)
def get_conversation(persona_id: str, study_id: str = Query(..., description="Study ID is required to scope the persona.")):
    history = get_conversation_history(persona_id=persona_id, study_id=study_id)
    return ConversationHistoryResponse(history=history)

@router.post("/{persona_id}/chat", response_model=ChatResponse)
def chat_endpoint(
    persona_id: str,
    request: ChatRequest,
    study_id: str = Query(..., description="Study ID is required to scope the persona.")
):
    return chat_with_persona(
        study_id=study_id,
        persona_id=persona_id,
        request=request
    )
