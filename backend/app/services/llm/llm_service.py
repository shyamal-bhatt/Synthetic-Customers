from app.services.llm.cloud_provider import CloudLLMProvider

class LLMService:
    def __init__(self):
        self.cloud_provider = CloudLLMProvider()

    def call_gemini(self, prompt: str, system_instruction: str = None, model_name: str = "gemini-2.5-flash") -> str:
        return self.cloud_provider.call_gemini(prompt, system_instruction, model_name)

    def call_groq(self, prompt: str, system_instruction: str = None, model_name: str = "llama-3.1-8b-instant") -> str:
        return self.cloud_provider.call_groq(prompt, system_instruction, model_name)
