import json
from datetime import datetime
from fastapi import HTTPException
from app.db.supabase import get_supabase
from app.core.logging import get_logger
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryItem
from app.services.llm import LLMService

logger = get_logger()

MAX_HISTORY_TURNS = 10

def get_conversation_history(persona_id: str, study_id: str):
    client = get_supabase()
    result = client.table("persona_conversations") \
        .select("*") \
        .eq("persona_id", persona_id) \
        .eq("study_id", study_id) \
        .order("turn_number", desc=False) \
        .execute()
    
    return [ChatHistoryItem(**row) for row in result.data]

def chat_with_persona(study_id: str, persona_id: str, request: ChatRequest) -> ChatResponse:
    client = get_supabase()
    
    from app.db.repositories import StudyRepository
    study_details = StudyRepository.get_study_details(study_id)
    if not study_details:
        raise HTTPException(status_code=404, detail="Study not found")
        
    product_idea = study_details.get("config", {}).get("productIdea", "N/A")
    mcq_form = study_details.get("mcqForm", {})
    mcq_answers = study_details.get("mcqAnswers", {})
    synthesis = study_details.get("synthesis", {})
    
    # Format MCQ
    mcq_transcript = []
    if isinstance(mcq_form, dict) and "questions" in mcq_form:
        for q in mcq_form["questions"]:
            q_id = q.get("id")
            q_text = q.get("question")
            ans_id = mcq_answers.get(q_id)
            ans_label = "N/A"
            if ans_id:
                for opt in q.get("options", []):
                    if opt.get("id") == ans_id:
                        ans_label = opt.get("label")
                        break
            mcq_transcript.append(f"Q: {q_text}\nResearcher Selected Target Answer: {ans_label}")
    mcq_str = "\n".join(mcq_transcript)

    synthesis_str = json.dumps(synthesis, indent=2) if synthesis else "N/A"
    
    # 1. Fetch Persona and Feedback
    persona_res = client.table("personas").select("*").eq("id", persona_id).execute()
    if not persona_res.data:
        raise HTTPException(status_code=404, detail="Persona not found")
    persona = persona_res.data[0]

    feedback_res = client.table("feedback").select("*").eq("persona_id", persona_id).execute()
    feedback = feedback_res.data[0] if feedback_res.data else {}

    # 2. Get Max Turn Number
    turn_res = client.table("persona_conversations") \
        .select("turn_number") \
        .eq("persona_id", persona_id) \
        .order("turn_number", desc=True) \
        .limit(1) \
        .execute()
    
    last_turn = turn_res.data[0]["turn_number"] if turn_res.data else 0
    user_turn = last_turn + 1
    assistant_turn = last_turn + 2

    # 3. Insert User Message
    user_msg_data = {
        "study_id": study_id,
        "persona_id": persona_id,
        "role": "user",
        "content": request.message,
        "turn_number": user_turn
    }
    client.table("persona_conversations").insert(user_msg_data).execute()

    # 4. Build System Prompt
    system_prompt = f"""You are roleplaying as a specific person in a one-on-one research 
interview. You have already evaluated a product and given your 
initial feedback. Now the researcher wants to go deeper with you.

PRODUCT IDEA UNDER EVALUATION:
{product_idea}

STUDY MCQ TARGET AUDIENCE PARAMETERS (The researcher is looking for people who match this):
{mcq_str}

OVERALL COHORT SYNTHESIS (How the broader group felt, for context):
{synthesis_str}

YOU ARE THIS PERSON (You must adhere STRICTLY to these attributes and OCEAN profile):
Name: {persona.get('name')}
Age: {persona.get('age')}
Occupation: {persona.get('occupation')}
Location: {persona.get('location')}
Income: {persona.get('income_bracket')}
Current solution: {persona.get('current_solution')}
Biggest frustration: {persona.get('biggest_professional_frustration')}
Relationship with money: {persona.get('relationship_with_money')}
Trust style: {persona.get('trust_style')}
Dealbreaker: {persona.get('dealbreaker')}
Communication style: {persona.get('communication_style')}

YOUR OCEAN PROFILE:
Openness: {persona.get('ocean_profile', {}).get('openness')}/10
Conscientiousness: {persona.get('ocean_profile', {}).get('conscientiousness')}/10
Extraversion: {persona.get('ocean_profile', {}).get('extraversion')}/10
Agreeableness: {persona.get('ocean_profile', {}).get('agreeableness')}/10
Neuroticism: {persona.get('ocean_profile', {}).get('neuroticism')}/10

YOUR PRIOR EVALUATION OF THE PRODUCT:
Likelihood to buy: {feedback.get('likelihood_to_buy', 'N/A')}/5
Price reaction: {feedback.get('price_reaction', 'N/A')}
Overall statement: {feedback.get('overall_statement', 'N/A')}
Top objections: {feedback.get('top_objections', 'N/A')}
Features you want: {feedback.get('features_should_have', [])}
Features you don't want: {feedback.get('features_should_not_have', [])}

INTERVIEW RULES — follow all of these every turn:
- You are this specific person. Never break character.
- Your prior evaluation is your established position. You do not 
  contradict it without a very good reason given by the interviewer.
- Your communication style drives how you speak. Analytical means 
  measured sentences with reasoning. Blunt means short direct answers. 
  Enthusiastic means you elaborate freely.
- Your OCEAN scores drive your tone. Low agreeableness means you 
  push back, you do not soften criticism. High neuroticism means 
  risk comes up naturally in your answers.
- You can be moved by good arguments. If the interviewer addresses 
  your specific objection with a credible response, you acknowledge 
  it genuinely — you do not stubbornly refuse to update your view. 
  But you require real evidence, not reassurance.
- You do not volunteer information the interviewer has not asked for. 
  You answer what was asked. You may ask a clarifying question back 
  if it feels natural for your character.
- Keep responses to 3–5 sentences unless the question genuinely 
  requires more. Real people do not monologue in interviews.

Return your response as JSON with two fields:
{{
  "reply": "<your conversational response as this person>",
  "likelihood_update": <null if your position hasn't changed, 
                        or an integer 1–5 if this conversation 
                        has genuinely shifted your view>
}}"""

    # 5. Build LLM Prompt
    history = request.history
    if len(history) > MAX_HISTORY_TURNS * 2:
        trimmed = history[:2] + history[-(MAX_HISTORY_TURNS - 1) * 2:]
    else:
        trimmed = history
        
    prompt_lines = []
    for item in trimmed:
        prompt_lines.append(f"{item.role}: {item.content}")
    prompt_lines.append(f"user: {request.message}")
    full_prompt = "\n\n".join(prompt_lines)

    # 6. Call LLM (using Groq instead of Gemini for more reliable conversational roleplay)
    llm = LLMService()
    try:
        llm_response_text = llm.call_groq(prompt=full_prompt, system_instruction=system_prompt)
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise HTTPException(status_code=500, detail="LLM call failed")

    # 7. Parse JSON Fallback
    # Remove markdown code blocks if present
    if llm_response_text.startswith("```json"):
        llm_response_text = llm_response_text[7:]
    if llm_response_text.startswith("```"):
        llm_response_text = llm_response_text[3:]
    if llm_response_text.endswith("```"):
        llm_response_text = llm_response_text[:-3]
    llm_response_text = llm_response_text.strip()

    try:
        parsed = json.loads(llm_response_text)
        reply = parsed.get("reply", llm_response_text)
        likelihood_update = parsed.get("likelihood_update")
    except (json.JSONDecodeError, KeyError):
        logger.warning(f"LLM returned non-JSON response: {llm_response_text}")
        reply = llm_response_text
        likelihood_update = None

    # 8. Insert Assistant Message
    assistant_msg_data = {
        "study_id": study_id,
        "persona_id": persona_id,
        "role": "assistant",
        "content": reply,
        "turn_number": assistant_turn,
        "likelihood_update": likelihood_update
    }
    client.table("persona_conversations").insert(assistant_msg_data).execute()

    # 9. Update Feedback Table if Shift Occurred
    if likelihood_update is not None and feedback:
        client.table("feedback") \
            .update({
                "likelihood_to_buy": likelihood_update,
                "likelihood_updated_at": datetime.utcnow().isoformat()
            }) \
            .eq("id", feedback["id"]) \
            .execute()

    return ChatResponse(reply=reply, likelihood_update=likelihood_update)
