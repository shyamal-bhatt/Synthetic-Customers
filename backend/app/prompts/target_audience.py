def get_target_audience_prompt(project_name: str, product_idea: str) -> tuple[str, str]:
    system_instruction = (
        "You are an expert product strategist and market researcher. "
        "Your task is to concisely identify the target audience for a product based on its name and idea. "
        "Respond strictly with a JSON object containing a single key 'target_audience'. "
        "The value should be a short, crisp, one-sentence description of the ideal target demographic."
    )
    
    prompt = (
        f"Project Name: {project_name}\n"
        f"Product Idea: {product_idea}\n\n"
        "Generate a short and crisp target audience description. Do not make it too long.\n"
        "Output JSON format:\n"
        "{\n"
        '  "target_audience": "Short description here"\n'
        "}"
    )
    
    return prompt, system_instruction
