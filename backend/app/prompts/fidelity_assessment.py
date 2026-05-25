import math
import json
from collections import Counter

FIDELITY_ASSESSMENT_SYSTEM_PROMPT = """You are performing a blind fidelity assessment on synthetic customer 
research data. You have no knowledge of the prompts that generated 
this data. You are judging the output purely on its own properties.

Fidelity means: does this data look like it came from real, distinct 
human beings, or from a model producing statistically uniform outputs?
You are not evaluating whether the feedback is positive or negative 
about the product. You are only evaluating realism and diversity.

Always return raw valid JSON. No markdown. No backticks. No explanation."""

def calculate_score_variance(feedback_array: list) -> dict:
    scores = [f["likelihood_to_buy"] for f in feedback_array]
    mean = sum(scores) / len(scores) if scores else 0
    std_dev = math.sqrt(sum((s - mean) ** 2 for s in scores) / len(scores)) if scores else 0
    distribution = dict(Counter(scores))
    extremes = sum(1 for s in scores if s in (1, 5))
    
    if std_dev >= 1.4 and extremes >= 2:
        score = 100
    elif std_dev >= 1.2:
        score = 80
    elif std_dev >= 1.0:
        score = 60
    elif std_dev >= 0.8:
        score = 40
    else:
        score = 20
    
    return {
        "score": score,
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "distribution": {str(k): distribution.get(k, 0) for k in range(1, 6)},
        "evidence": f"Mean {round(mean,2)}, std dev {round(std_dev,2)}, distribution {distribution}, {extremes} personas at extremes."
    }

def merge_personas_feedback(personas: list, feedback: list) -> list:
    feedback_map = {f["persona_id"]: f for f in feedback}
    return [
        {**persona, "feedback": feedback_map.get(persona["id"], {})}
        for persona in personas
    ]

def get_fidelity_assessment_user_prompt(
    product_idea: str,
    audience_description: str,
    personas_array: list,
    feedback_array: list
) -> str:
    variance_result = calculate_score_variance(feedback_array)
    merged = merge_personas_feedback(personas_array, feedback_array)
    
    return f"""PRODUCT THAT WAS RESEARCHED:
- Product idea: {product_idea}
- Target audience: {audience_description}

MERGED PERSONA PROFILES AND FEEDBACK:
{json.dumps(merged, indent=2)}

---

CALCULATE THE FOLLOWING 5 DIMENSIONS.
For each dimension, analyse the raw data, find specific evidence, 
assign a score 0–100, and write one sentence of evidence.
Do not invent evidence. Only cite what you directly observe.

---

DIMENSION 1 — SCORE VARIANCE (PRE-CALCULATED — DO NOT RECALCULATE)
Use this result directly:
{json.dumps(variance_result, indent=2)}

---

DIMENSION 2 — PROFILE BEHAVIOURAL COHERENCE
Goal: each persona's feedback must be consistent with their 
stated profile. Generic responses that ignore the profile 
are a fidelity failure.

For each persona run these exact checks:

CHECK A — Price coherence
  If relationship_with_money is "price_sensitive" 
  AND price_reaction is "dealbreaker"
  THEN likelihood_to_buy must be 1 or 2.
  If it is 3 or higher → mark this persona INCOHERENT, reason: "price mismatch"

CHECK B — Awareness coherence  
  If awareness_of_problem is "unaware"
  THEN likelihood_to_buy must not be 5.
  If it is 5 → mark INCOHERENT, reason: "unaware persona cannot be immediate buyer"

CHECK C — Agreeableness coherence
  If ocean_agreeableness is 1, 2, 3, or 4
  THEN at least one objection must have severity "dealbreaker" or "strong"
  If all objections are "moderate" → mark INCOHERENT, reason: "low agreeableness persona has no strong objections"

CHECK D — Neuroticism coherence
  If ocean_neuroticism is 7, 8, 9, or 10
  THEN overall_statement OR at least one objection text must contain 
  at least one of these words: risk, reliable, reliability, security, 
  trust, data, switch, switching, lose, shutdown, uncertainty
  If none found → mark INCOHERENT, reason: "high neuroticism persona expresses no risk concern"

CHECK E — Trust style coherence
  If trust_style is "needs_social_proof"
  THEN at least one would_overcome_if field must reference peers, 
  other users, case studies, testimonials, or social validation.
  If would_overcome_if only mentions data, trials, or independent 
  research → mark INCOHERENT, reason: "social proof persona resolves via data not peers"

  If trust_style is "self_researcher"
  THEN at least one would_overcome_if must reference trial access, 
  documentation, or independent testing.
  If would_overcome_if only mentions peer recommendations 
  → mark INCOHERENT, reason: "self researcher persona resolves via social proof"

After running all checks on all personas:
  coherent_count = personas that passed all applicable checks
  incoherent_count = personas that failed at least one check
  coherence_rate = coherent_count divided by total personas

Scoring:
  coherence_rate >= 0.90  →  100
  coherence_rate >= 0.75  →  75
  coherence_rate >= 0.60  →  50
  coherence_rate >= 0.45  →  30
  coherence_rate <  0.45  →  10

Evidence sentence: state coherence_rate and list every persona_id 
that was marked INCOHERENT with their reason.

---

DIMENSION 3 — OBJECTION DIVERSITY
Goal: objections should reflect the specific concerns of distinct 
people. Recycled phrasing or the same underlying concern appearing 
in the majority of personas is a synthetic fingerprint.

Step 1: Collect every objection string from every persona's 
top_objections array across all feedback. You now have a flat 
list of all objections.

Step 2: Group objections that express the same underlying concern, 
even if worded differently. Use these grouping rules:
  - Same root concern = same group regardless of wording
  - "Too expensive", "price is high", "costs too much" = same group
  - "Not sure I trust it", "need more proof", "seems unproven" = same group
  - "Too complex to set up", "onboarding looks hard", "steep learning curve" = same group

Step 3: Count total objections and count distinct groups.
  diversity_rate = distinct groups divided by total objections

Step 4: Identify the single most repeated concern and count 
how many personas raised it. If one concern appears in more 
than 60% of personas that is a red flag.

Scoring:
  diversity_rate >= 0.75 AND no concern in more than 40% of personas  →  100
  diversity_rate >= 0.60                                               →  75
  diversity_rate >= 0.45                                               →  50
  diversity_rate >= 0.30                                               →  30
  diversity_rate <  0.30 OR one concern in more than 60% of personas  →  10

Evidence sentence: state diversity_rate, list the top 3 most 
repeated concern groups and how many personas each appeared in.

---

DIMENSION 4 — OCEAN BEHAVIOURAL ALIGNMENT
Goal: OCEAN scores must have visibly driven the feedback content, 
not just been assigned as labels. If extreme OCEAN scores produced 
the same feedback as moderate scores, OCEAN was decorative.

Run these checks on personas with extreme scores only 
(scores of 1, 2, 3 or 8, 9, 10 — ignore middle range 4–7):

CHECK A — High openness (score 8–10)
  overall_statement or features_should_have should express 
  curiosity, potential, or interest in what the product could become.
  If the statement is purely evaluative with no forward-looking 
  or curious language → flag as MISALIGNED

CHECK B — Low openness (score 1–3)
  overall_statement should open with skepticism, doubt, or 
  resistance. If it opens positively or neutrally → flag MISALIGNED

CHECK C — High conscientiousness (score 8–10)
  features_should_have must include at least one item about 
  reliability, integration, data integrity, or workflow fit.
  If all items are about convenience or features → flag MISALIGNED

CHECK D — Low conscientiousness (score 1–3)
  features_should_not_have must include at least one item about 
  complexity, setup, configuration, or too many options.
  If absent → flag MISALIGNED

CHECK E — High neuroticism (score 8–10)
  Already checked in Dimension 2 Check D. 
  If that check passed, mark ALIGNED here automatically.

CHECK F — Low agreeableness (score 1–3)
  Already checked in Dimension 2 Check C.
  If that check passed, mark ALIGNED here automatically.

After all checks:
  aligned_count = extreme-score personas that passed their check
  checked_count = total extreme-score personas checked
  alignment_rate = aligned_count divided by checked_count
  If checked_count is 0, alignment_rate = 1.0 (no extreme scores to check)

Scoring:
  alignment_rate >= 0.85  →  100
  alignment_rate >= 0.70  →  75
  alignment_rate >= 0.55  →  50
  alignment_rate >= 0.40  →  30
  alignmeant_rate <  0.40  →  20

Evidence sentence: state alignment_rate and list every 
persona_id flagged MISALIGNED with which check they failed.

---

DIMENSION 5 — PERSONA DISTINCTIVENESS
Goal: each persona's overall_statement and open_feedback should 
sound like a different person. If statements are structurally 
similar, start with the same phrases, or use the same vocabulary, 
the model produced templates not people.

Step 1: Read all overall_statement and open_feedback fields 
across all personas.

Step 2: Check for these red flags:
  RED FLAG A — Opener similarity
  Count how many overall_statements start with the same word 
  or phrase pattern. If more than 30% open the same way 
  (e.g. all start with "As a..." or "I think..." or "Honestly...") 
  → mark opener similarity detected

  RED FLAG B — Structural mirroring
  Check if the statements follow the same structure: 
  positive observation, then concern, then conditional. 
  If more than 50% follow the exact same three-part structure 
  → mark structural mirroring detected

  RED FLAG C — Vocabulary recycling
  Identify the 5 most frequently used non-common words 
  across all statements (ignore: the, a, I, this, is, it, 
  would, could, my, for, of, and, to, that, with).
  If any single non-common word appears in more than 50% 
  of personas → mark vocabulary recycling detected

Step 3: Count how many red flags were detected (0, 1, 2, or 3).

Scoring:
  0 red flags  →  100
  1 red flag   →  65
  2 red flags  →  35
  3 red flags  →  10

Evidence sentence: list which red flags were detected and 
the specific evidence for each one.

---

FINAL SCORE CALCULATION

After completing all 5 dimensions, calculate the final score:

  final_score = (
    dimension_1_score * 0.25 +
    dimension_2_score * 0.30 +
    dimension_3_score * 0.20 +
    dimension_4_score * 0.15 +
    dimension_5_score * 0.10
  )

Round final_score to the nearest integer.

Assign a label:
  90–100  →  "high_fidelity"
  75–89   →  "good_fidelity"
  60–74   →  "moderate_fidelity"
  40–59   →  "low_fidelity"
  0–39    →  "unreliable"

Identify the single lowest scoring dimension. That is the 
primary_weakness. State it as the dimension name.

Write a single improvement_note: one sentence explaining 
what specifically caused the lowest score and what it means 
for how much the researcher should trust these results.

---

RETURN THIS EXACT JSON STRUCTURE.
No text before it. No text after it. No markdown. No backticks.

{{
  "dimensions": {{
    "score_variance": {{
      "score": <integer 0–100>,
      "mean": <number>,
      "std_dev": <number>,
      "distribution": {{ "1": <count>, "2": <count>, "3": <count>, "4": <count>, "5": <count> }},
      "evidence": "<one sentence>"
    }},
    "profile_coherence": {{
      "score": <integer 0–100>,
      "coherence_rate": <number 0.0–1.0>,
      "coherent_count": <integer>,
      "incoherent_count": <integer>,
      "incoherent_personas": [
        {{ "persona_id": "string", "reason": "string" }}
      ],
      "evidence": "<one sentence>"
    }},
    "objection_diversity": {{
      "score": <integer 0–100>,
      "diversity_rate": <number 0.0–1.0>,
      "total_objections": <integer>,
      "distinct_groups": <integer>,
      "most_repeated_concern": "<string>",
      "most_repeated_count": <integer>,
      "evidence": "<one sentence>"
    }},
    "ocean_alignment": {{
      "score": <integer 0–100>,
      "alignment_rate": <number 0.0–1.0>,
      "aligned_count": <integer>,
      "checked_count": <integer>,
      "misaligned_personas": [
        {{ "persona_id": "string", "failed_check": "string" }}
      ],
      "evidence": "<one sentence>"
    }},
    "persona_distinctiveness": {{
      "score": <integer 0–100>,
      "red_flags_detected": <integer 0–3>,
      "red_flags": [
        "<name of red flag detected>"
      ],
      "evidence": "<one sentence>"
    }}
  }},
  "final_score": <integer 0–100>,
  "label": "high_fidelity | good_fidelity | moderate_fidelity | low_fidelity | unreliable",
  "primary_weakness": "<dimension name>",
  "improvement_note": "<one sentence>"
}}"""
