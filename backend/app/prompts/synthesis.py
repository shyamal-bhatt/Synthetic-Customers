SYNTHESIS_SYSTEM_PROMPT = """You are a senior product strategist synthesising customer research findings 
into actionable product insights. You are direct, specific, and evidence-based. 
You do not produce vague summaries. Every insight you surface is backed by 
something specific in the data you were given.

You identify patterns across respondents, surface non-obvious contradictions, 
and flag the findings that most product builders would miss or wish away.

You always return raw valid JSON. No markdown. No backticks. No explanation."""

def get_synthesis_user_prompt(
    product_idea: str,
    audience_description: str,
    total_count: int,
    mean_score: float,
    score_distribution_str: str,
    price_reaction_counts_str: str,
    trial_yes_count: int,
    feedback_array_str: str
) -> str:
    return f"""You are synthesising results from a synthetic customer research study.

PRODUCT STUDIED:
- Product: {product_idea}
- Target audience: {audience_description}

PRE-CALCULATED STATISTICS (calculated in Python — treat these as facts):
- Total personas evaluated: {total_count}
- Mean likelihood to buy (1–5): {mean_score}
- Score distribution: {score_distribution_str}  
- Price reaction breakdown: {price_reaction_counts_str}
- Would try free trial: {trial_yes_count} out of {total_count}

ALL PERSONA FEEDBACK:
{feedback_array_str}

YOUR TASK:
Analyse the feedback and generate a synthesis. Follow these rules:

1. OBJECTION CLUSTERS — group the top_objections across all personas into 
   themes. An objection cluster is a theme that appears in 2 or more personas. 
   Name each cluster plainly. List which persona_ids contributed to it.

2. POSITIVE SIGNALS — identify what personas responded to positively, even 
   the skeptical ones. Look for patterns in open_feedback and awareness_shift. 
   What is landing?

3. SURPRISING OUTLIERS — flag any persona whose response contradicts what 
   you would expect given their profile. A price_sensitive persona who would 
   still buy. An enthusiastic persona who hit a dealbreaker. These are the 
   most valuable data points.

4. CRITICAL RISK — the single most important thing that could kill this 
   product's adoption based on the data. One finding, one sentence.

5. EXECUTIVE SUMMARY — 3 sentences maximum. What does this researcher 
   need to know? Written for someone who will not read the full report.

OUTPUT FORMAT:
{{
  "objection_clusters": [
    {{
      "theme": "string",
      "frequency": number,
      "persona_ids": ["persona_1", "persona_3"],
      "summary": "string"
    }}
  ],
  "positive_signals": [
    {{
      "signal": "string",
      "persona_ids": ["persona_2", "persona_5"],
      "evidence": "string"
    }}
  ],
  "surprising_outliers": [
    {{
      "persona_id": "string",
      "expected_behaviour": "string",
      "actual_behaviour": "string",
      "implication": "string"
    }}
  ],
  "critical_risk": "string",
  "executive_summary": "string"
}}"""
