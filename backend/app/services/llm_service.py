# Backwards compatible re-export of LLMService
# Decoupled LLM provider modules are located under app/services/llm/

from app.services.llm import LLMService

__all__ = ["LLMService"]
