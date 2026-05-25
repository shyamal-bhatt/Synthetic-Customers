# 🧠 LLM Abstraction & Execution Space

Welcome to the **LLM Integration Layer**! This directory serves as a dedicated space to navigate, manage, and understand how this application interacts with Large Language Models.

We support two distinct modes of execution, seamlessly toggleable from the Frontend UI:
1. **Cloud APIs (Multi-Provider High Fidelity)**: Distributes concurrent tasks across Google Gemini (AI Studio) and Groq.
2. **Local Inference (Independent & Private)**: Runs a single local model (**Llama 3.1 8B**) using an Ollama server.

---

## Directory Architecture

```text
backend/app/services/llm/
├── README.md             # This architecture and navigation documentation
├── __init__.py          # Package entry exposing the unified LLMService
├── llm_service.py       # Facade orchestrator that handles dynamic routing
├── local_provider.py    # Local Ollama client (sends prompts to Llama 3.1 8B)
└── cloud_provider.py    # Cloud API clients (sends prompts to Gemini/Groq APIs)
```

---

## ⚡ 1. Local Model Setup (Llama 3.1 8B)

To run the study simulations entirely on your machine without external cloud dependencies:

### Step 1: Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com/) (available for macOS, Linux, and Windows).

### Step 2: Download & Run Llama 3.1 8B
Start the Ollama app or run the following command in your terminal:
```bash
ollama run llama3.1
```
This will download the `llama3.1:8b` weights (approx. 4.7 GB) and boot up the local server on `http://localhost:11434`.

### Step 3: Verify the Local Server
Run a quick curl request to verify the server is live and ready:
```bash
curl http://localhost:11434/api/tags
```
You should see a JSON array containing the `"llama3.1"` model.

---

## 🌐 2. Cloud API Providers

When running in **API Mode**, the system utilizes a high-throughput hybrid strategy to build, refine, and simulate customer cohorts in under 5 minutes:

### Google AI Studio (Gemini)
* **Default Model**: `gemini-2.5-flash`
* **Fallback Chain**: `gemini-2.5-flash` ➡️ `gemini-3.5-flash` ➡️ `gemini-3.1-flash-lite` ➡️ `gemini-2.5-flash-lite` ➡️ `gemini-3-flash` ➡️ `gemini-1.5-flash`.
* **Primary Use**: Clarifying MCQs generation, Initial Cohort Persona generation, and Cluster Synthesis summary calls.

### Groq API (Llama 3.3)
* **Model**: `llama3-8b-8192`
* **Primary Use**: Concurrent customer feedback loop simulation. By executing Gemini and Groq API calls in parallel (e.g. 75% Groq, 25% Gemini), we bypass typical cloud rate limits.

---

## 🛠️ Configuration Settings

The LLM providers automatically read configuration values from your environment or `backend/.env`:

* **`OLLAMA_BASE_URL`**: Target local port endpoint (defaults to `"http://localhost:11434"`).
* **`LOCAL_MODEL_NAME`**: Local model identifier (defaults to `"llama3.1"`).
* **`GEMINI_API_KEY`**: Your Google AI Studio token.
* **`GROQ_API_KEY`**: Your Groq API key.

---

## 🧭 Navigating the Code

* **Routing Facade** (`llm_service.py`):
  All services within the backend call `self.llm_service.call_gemini(...)` or `self.llm_service.call_groq(...)` passing an optional `model_mode` param. If the header `X-Model-Mode: local` is sent, the facade automatically redirects all prompt traffic to:
  ```python
  self.local_provider.call_local(prompt, system_instruction)
  ```
  This keeps all service logic (prompts, statistics, loops) **identical** regardless of the model environment.

* **Structured Outputs**:
  To guarantee that the backend can parse responses into structured Pydantic schemas, both local and cloud providers request JSON outputs:
  * Local Ollama: `"format": "json"` payload attribute.
  * Cloud Gemini: `"responseMimeType": "application/json"` config.
  * Cloud Groq: `"response_format": {"type": "json_object"}`.
