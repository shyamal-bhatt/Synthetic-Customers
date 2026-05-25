from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ChatHistoryItem(BaseModel):
    role: str
    content: str
    turn_number: Optional[int] = None
    likelihood_update: Optional[int] = None
    created_at: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    history: List[ChatHistoryItem] = Field(default=[], max_length=50)

class ChatResponse(BaseModel):
    reply: str
    likelihood_update: Optional[int] = None

class ConversationHistoryResponse(BaseModel):
    history: List[ChatHistoryItem]
