def get_study_mcq_prompt(product_idea: str, target_audience: str) -> str:
    """
    Generates the prompt for Gemini 2.5 Flash to build 5 clarifying multiple-choice questions
    covering the 5 mandatory dimensions of research.
    """
    return f"""You are generating clarifying questions for a synthetic customer research study.

PRODUCT BEING STUDIED:
- Product idea: {product_idea}
- Target audience: {target_audience}

YOUR TASK:
Analyze the product idea and target audience. Identify ONLY the dimensions 
where you lack enough context to simulate realistic customer personas.
Generate between 1 and 6 questions — only the ones that are genuinely needed.

If the product idea already makes a dimension obvious, skip that question entirely.
Quality over quantity. A focused 2-question set beats a padded 6-question set.

AVAILABLE DIMENSIONS (use only what's necessary, in this order if selected):

  1. PRICING TOLERANCE
     What do people in this audience currently spend on the closest alternative?
     Anchor options to real tools or behaviours they're already paying for.
     Do not use abstract willingness-to-pay ranges.

  2. PROBLEM URGENCY
     How acutely does this audience feel the problem right now?
     Options should range from passive awareness to actively seeking a solution today.
     Tailor language to the specific pain point this product addresses.

  3. CURRENT BEHAVIOUR
     What are people doing today to solve this problem?
     Options must be specific: name realistic competitor tools, manual workarounds,
     hiring someone, or doing nothing. No generic options.

  4. USAGE & WORKFLOW FIT
     How would this product fit into their existing workflow?
     Options should reflect frequency and context of use —
     daily core tool, weekly reference, occasional resource, etc.
     This shapes how deeply the product would need to integrate into their life.

  5. EVALUATION METHOD
     How would someone in this audience validate the product before committing?
     Options should reflect real validation behaviours:
     free trial, peer recommendation, case study, live demo, etc.
     Pick the 4 most realistic for this specific audience.

  6. SUCCESS DEFINITION
     What does "this worked" look like for someone in this audience 90 days in?
     Options should reflect concrete outcomes — time saved, revenue gained,
     stress reduced, team adoption, etc.
     These must be specific to this product's value proposition.

STRICT RULES:
- Only generate a question if that dimension is genuinely unclear from 
  the product idea and target audience provided. Skip obvious ones.
- Every question must be framed toward the product BUILDER,
  asking about their target audience — not at the user themselves.
  Correct: "How would your target audience validate this before buying?"
  Wrong:   "How would YOU validate this before buying?"
- Answer options must be written in first-person customer voice,
  as if the customer is speaking. This is critical — the answers will be
  fed directly into persona simulations.
  Correct: "I'd want a 2-week free trial before entering my card"
  Wrong:   "They would need a free trial before committing"
- Exactly 4 options per question, labeled a, b, c, d
- Options must be mutually exclusive — no overlap
- No open-ended options like "Other", "It depends", or "Not sure"
- No demographic questions (age, gender, location, company size)
- Questions must be specific to THIS product and THIS audience.
  If the same question would work for a completely different product,
  rewrite it until it wouldn't.

OUTPUT FORMAT:
Return a single JSON object. No text before it. No text after it. 
No markdown. No backticks.

{{
  "questions": [
    {{
      "id": "q1",
      "dimension": "<dimension_key>",
      "question": "<question text>",
      "options": [
        {{ "id": "a", "label": "<first-person customer voice option>" }},
        {{ "id": "b", "label": "<first-person customer voice option>" }},
        {{ "id": "c", "label": "<first-person customer voice option>" }},
        {{ "id": "d", "label": "<first-person customer voice option>" }}
      ]
    }}
  ]
}}

Valid dimension keys: pricing_tolerance, problem_urgency, current_behaviour,
usage_workflow_fit, evaluation_method, success_definition"""
