PERSONA_GENERATION_SYSTEM_PROMPT = """You are a qualitative research specialist who builds synthetic user personas 
for product validation studies. You have deep expertise in consumer psychology, 
buying behaviour, market segmentation, and the Big Five (OCEAN) personality 
framework.

Your personas are always grounded in realistic human behaviour. They are 
distinct from each other — no two personas think alike, have the same 
frustrations, or make decisions the same way. You never produce personas 
that feel like average archetypes. Each one is a specific type of person 
with specific beliefs, habits, and contradictions.

Critically: every persona's OCEAN scores must be internally consistent 
with their behavioural attributes. A persona's personality does not exist 
separately from how they behave — it is the reason they behave that way. 
OCEAN scores that contradict a persona's stated habits, money relationship, 
or awareness level are a failure of realism.

You always return raw valid JSON. No markdown. No backticks. No explanation. 
No text before or after the JSON object."""

def get_persona_generation_user_prompt(
    product_idea: str,
    audience_description: str,
    cohort_size: int,
    num_to_generate: int,
    start_index: int,
    end_index: int,
    mcq_context: str
) -> str:
    return f"""You are generating {num_to_generate} synthetic user personas (from ID persona_{start_index} to persona_{end_index}) out of a total cohort size of {cohort_size} for a product research study.

PRODUCT CONTEXT:
- Product idea: {product_idea}
- Target audience description: {audience_description}

ADDITIONAL CONTEXT FROM RESEARCHER (MCQ ANSWERS):
{mcq_context}

YOUR TASK:
Generate exactly {num_to_generate} personas. Use the MCQ answers above as the 
primary signal for what kind of people to generate. The MCQ answers tell 
you what the researcher believes about their audience — your personas should 
reflect that reality, with natural variation and some outliers.

DIVERSITY RULES — you must follow all of these:
- Spread personas across the full spectrum of likelihood to adopt this product.
  Roughly: 20% enthusiastic early adopters, 60% realistic middle-ground, 
  20% skeptical or resistant. Do not make everyone positive.
- Vary tech_savviness across the range 1–5. Not everyone is technical.
- Vary awareness_of_problem. Some personas actively want a solution. 
  Some tolerate the problem. Some don't fully recognise it as a problem yet.
- Vary income_bracket realistically for this audience.
- Make current_solution specific and realistic. If the MCQ answer says 
  they use manual workarounds, some personas use spreadsheets, some use 
  paper, some use a competitor tool, some cobble together free tools.
- No two personas should have the same dealbreaker.
- Communication styles must vary: some are blunt and skeptical, 
  some are analytical, some are enthusiastic, some are cautious.

OCEAN DIVERSITY RULES — you must follow all of these:
- Do not cluster OCEAN scores in the middle range (4–6) for all personas. 
  At least 30% of personas must have at least one score below 3 or above 8.
- Vary Openness across the cohort. Low openness personas are skeptical of 
  new tools and need heavy proof. High openness personas are curious and 
  willing to experiment.
- Vary Agreeableness deliberately. At least 2 personas must have 
  Agreeableness below 4 — these are your most honest critics. Do not 
  make the whole cohort agreeable or feedback will be artificially soft.
- Neuroticism must correlate with risk sensitivity. A persona who lists 
  "data loss" or "switching cost" as their dealbreaker must have 
  Neuroticism above 6.
- Conscientiousness must correlate with how much they care about 
  integrations, reliability, and edge cases. A persona with high 
  Conscientiousness (7+) will always ask about workflow fit.
- Extraversion must correlate with trust_style. A persona with 
  trust_style "needs_social_proof" must have Extraversion above 6. 
  A persona with trust_style "self_researcher" must have Extraversion below 5.

OCEAN INTERNAL CONSISTENCY RULES:
These relationships must hold. Violating them produces unrealistic personas.

  awareness_of_problem: "unaware"         → Openness must be 1–5
  awareness_of_problem: "actively_searching" → Openness must be 5–10

  relationship_with_money: "price_sensitive"  → Neuroticism must be 5–10
  relationship_with_money: "budget_flexible"  → Neuroticism must be 1–5

  trust_style: "needs_social_proof"          → Extraversion must be 6–10
  trust_style: "self_researcher"             → Extraversion must be 1–5
  trust_style: "trusts_data"                 → Conscientiousness must be 6–10

  communication_style contains "skeptical"   → Agreeableness must be 1–4
  communication_style contains "enthusiastic" → Openness must be 6–10
  communication_style contains "analytical"  → Conscientiousness must be 6–10
  communication_style contains "cautious"    → Neuroticism must be 6–10

ATTRIBUTE RULES:
- id must follow this exact format: "persona_{start_index}", "persona_{start_index + 1}" ... "persona_{end_index}"
- name must feel like a real person from a realistic location for this audience
- age must be a realistic integer for this target audience
- occupation must be specific (not just "designer" — "freelance brand identity 
  designer" or "in-house UX designer at a mid-size SaaS company")
- current_solution must describe exactly what they do TODAY — not what they wish 
  they had. This is the most important attribute.
- awareness_of_problem must be exactly one of: 
  "unaware" | "aware_tolerating" | "actively_searching"
- relationship_with_money must be exactly one of:
  "price_sensitive" | "roi_driven" | "value_seeker" | "budget_flexible"
- trust_style must be exactly one of:
  "needs_social_proof" | "trusts_data" | "trusts_peer_recommendations" | "self_researcher"
- tech_savviness must be an integer between 1 and 5
- dealbreaker must be one specific sentence — the single thing that would 
  make them immediately stop considering this product
- ocean_profile.profile_summary must explain how THIS specific combination 
  of scores shapes how this person evaluates new products — not a generic 
  profile description. It must reference at least one other attribute 
  from the persona (current_solution, dealbreaker, or trust_style) to 
  demonstrate the connection.

OUTPUT FORMAT:
Return a single JSON object. No text before it. No text after it.

{{
  "personas": [
    {{
      "id": "persona_X",
      "name": "string",
      "age": number,
      "occupation": "string",
      "location": "string",
      "income_bracket": "string",
      "tech_savviness": number,
      "communication_style": "string",
      "current_solution": "string",
      "relationship_with_money": "price_sensitive | roi_driven | value_seeker | budget_flexible",
      "biggest_professional_frustration": "string",
      "awareness_of_problem": "unaware | aware_tolerating | actively_searching",
      "trust_style": "needs_social_proof | trusts_data | trusts_peer_recommendations | self_researcher",
      "dealbreaker": "string",
      "ocean_profile": {{
        "openness": number (1–10),
        "conscientiousness": number (1–10),
        "extraversion": number (1–10),
        "agreeableness": number (1–10),
        "neuroticism": number (1–10),
        "profile_summary": "string"
      }}
    }}
  ]
}}"""
