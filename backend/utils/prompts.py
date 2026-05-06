SYSTEM_PROMPT = """You are an expert sales copywriter. You write cold outreach emails that feel human, 
specific, and respectful of the reader's time. You never use clichés like "Hope this 
finds you well" or "I wanted to reach out." Your emails are short (under 100 words in 
the body), punchy, and end with a clear but low-pressure call to action.
Always respond with valid JSON only. No markdown. No explanation. No code fences.
"""

def build_initial_prompt(name: str, role: str, company: str, sender_name: str = "", context: dict = None) -> str:
    sender_line = f"\nSender: {sender_name}" if sender_name else ""
    
    ctx = ""
    if context and context.get("best_hook"):
        pains = ", ".join(context.get("likely_pain_points", [])[:2])  # Max 2 pain points
        ctx = (
            f"\nContext: {company} is {context.get('company_stage','unknown')}. "
            f"Hook: {context.get('best_hook','')}. "
            f"Pains: {pains}."
        )

    return (
        f"Lead: {name}, {role} at {company}.{sender_line}{ctx}\n\n"
        f"Write 3 cold email variants. Body <100 words each. No placeholders.\n"
        f"Sign with sender name above.\n"
        f'Return JSON: {{"friendly":{{"subject":"...","body":"..."}},'
        f'"direct":{{"subject":"...","body":"..."}},'
        f'"curiosity":{{"subject":"...","body":"..."}}}}'
    )

def build_followup_prompt(name: str, role: str, company: str, initial_tone: str, followup_tone: str, sender_name: str = "") -> str:
    sender_line = f"\nSender: {sender_name}" if sender_name else ""
    return (
        f"Prior email tone: {initial_tone}. No reply.\n"
        f"Lead: {name}, {role} at {company}.{sender_line}\n\n"
        f"Write ONE {followup_tone}-tone follow-up. Under 60 words. "
        f"Reference prior outreach without repeating it. End with a question.\n"
        f'Return JSON: {{"subject":"...","body":"..."}}'
    )
