def get_study_mcq_prompt(product_idea: str, target_audience: str) -> str:
    """
    Generates the prompt for Gemini 2.5 Flash to build 5 clarifying multiple-choice questions
    covering the 5 mandatory dimensions of research.
    """
    return f"""You are generating 5 clarifying questions for a synthetic customer research study.

PRODUCT BEING STUDIED:
- Product idea: {product_idea}
- Target audience: {target_audience}

YOUR TASK:
Generate exactly 5 multiple-choice questions. Each question must cover 
a different dimension from this list — cover all 5, in this order:

  1. PRICING TOLERANCE
     How much would someone in this audience realistically pay?
     Anchor the price options to what makes sense for this specific product.
     Do not use generic ranges like "$0–$10". Make the options reflect 
     real purchase decisions this audience would face.

  2. PROBLEM URGENCY  
     How acutely does this audience feel the problem right now?
     Options should range from "I don't feel this problem" to 
     "I need a solution immediately". Tailor the language to the 
     specific pain point this product addresses.

  3. CURRENT BEHAVIOUR
     What are people in this audience doing today to solve this problem?
     Options should be realistic alternatives: competitor tools, 
     manual workarounds, doing nothing, hiring someone, etc.
     These options must be specific to this domain — not generic.

  4. PURCHASE TRIGGER
     What single thing would make someone in this audience decide to buy?
     Options should reflect different buyer motivations: saves time, 
     saves money, reduces risk, social proof, integrates with existing tools, etc.
     Pick the 4 most relevant motivations for this specific audience.

  5. BIGGEST HESITATION
     What would make someone in this audience NOT buy?
     Options should reflect real objections: price, trust, complexity, 
     "I'll build it myself", "I'll wait for a bigger brand to do this", etc.
     These must be specific to this product category — not generic fears.

STRICT RULES:
- Every question must be written as if directed at the product builder,
  asking about their TARGET AUDIENCE — not at the user themselves.
  Example of correct framing: "How urgently does your target audience feel this problem?"
  Example of wrong framing: "How urgently do YOU feel this problem?"
- Exactly 4 options per question, labeled a, b, c, d
- Options must be mutually exclusive — no overlap, no "all of the above"
- No open-ended options like "Other", "It depends", or "Not sure"
- Do not ask about age, gender, location, or any demographic information
- Do not repeat any dimension across questions
- Questions must be specific to this product and this audience.
  If someone could submit a completely different product and your questions 
  would still make sense — your questions are too generic. Rewrite them.

OUTPUT FORMAT:
Return a single JSON object matching this schema exactly.
No text before it. No text after it. No markdown. No backticks.

{{
  "questions": [
    {{
      "id": "q1",
      "dimension": "pricing_tolerance",
      "question": "<the question text>",
      "options": [
        {{ "id": "a", "label": "<option text>" }},
        {{ "id": "b", "label": "<option text>" }},
        {{ "id": "c", "label": "<option text>" }},
        {{ "id": "d", "label": "<option text>" }}
      ]
    }},
    {{
      "id": "q2",
      "dimension": "problem_urgency",
      "question": "<the question text>",
      "options": [
        {{ "id": "a", "label": "<option text>" }},
        {{ "id": "b", "label": "<option text>" }},
        {{ "id": "c", "label": "<option text>" }},
        {{ "id": "d", "label": "<option text>" }}
      ]
    }},
    {{
      "id": "q3",
      "dimension": "current_behaviour",
      "question": "<the question text>",
      "options": [
        {{ "id": "a", "label": "<option text>" }},
        {{ "id": "b", "label": "<option text>" }},
        {{ "id": "c", "label": "<option text>" }},
        {{ "id": "d", "label": "<option text>" }}
      ]
    }},
    {{
      "id": "q4",
      "dimension": "purchase_trigger",
      "question": "<the question text>",
      "options": [
        {{ "id": "a", "label": "<option text>" }},
        {{ "id": "b", "label": "<option text>" }},
        {{ "id": "c", "label": "<option text>" }},
        {{ "id": "d", "label": "<option text>" }}
      ]
    }},
    {{
      "id": "q5",
      "dimension": "biggest_hesitation",
      "question": "<the question text>",
      "options": [
        {{ "id": "a", "label": "<option text>" }},
        {{ "id": "b", "label": "<option text>" }},
        {{ "id": "c", "label": "<option text>" }},
        {{ "id": "d", "label": "<option text>" }}
      ]
    }}
  ]
}}"""
