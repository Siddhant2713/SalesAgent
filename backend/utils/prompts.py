SYSTEM_PROMPT = """You are an expert sales copywriter. You write cold outreach emails that feel human, 
specific, and respectful of the reader's time. You never use clichés like "Hope this 
finds you well" or "I wanted to reach out." Your emails are short (under 100 words in 
the body), punchy, and end with a clear but low-pressure call to action.
Always respond with valid JSON only. No markdown. No explanation. No code fences.
"""

def build_initial_prompt(name: str, role: str, company: str, sender_name: str = "") -> str:
    sender_info = f"\n- Your Name (Sender): {sender_name}" if sender_name else ""
    return f"""Generate 3 cold outreach email variants for this lead:
- Lead Name: {name}
- Lead Role: {role}
- Lead Company: {company}{sender_info}

For each variant, provide a subject line and email body. DO NOT use placeholders like [Your Name] or [Company Name]. Sign off the email using the Sender Name provided above.

Tones required:
1. friendly — warm, conversational, like reaching out to a potential collaborator
2. direct — straight to value, no fluff, businesslike
3. curiosity — opens with a question that makes them think, creates intrigue

Return ONLY valid JSON in this exact format with no markdown or explanation:
{{
  "friendly":  {{ "subject": "...", "body": "..." }},
  "direct":    {{ "subject": "...", "body": "..." }},
  "curiosity": {{ "subject": "...", "body": "..." }}
}}
"""

def build_followup_prompt(name: str, role: str, company: str, initial_tone: str, followup_tone: str, sender_name: str = "") -> str:
    sender_info = f"\n- Your Name (Sender): {sender_name}" if sender_name else ""
    return f"""You sent a cold email to this person and they haven't replied yet.

Lead info:
- Lead Name: {name}
- Lead Role: {role}
- Lead Company: {company}{sender_info}

The initial email used a "{initial_tone}" tone. Now write a single follow-up email 
using a "{followup_tone}" tone. Keep it under 60 words. Reference that you reached out 
before, but don't be pushy. End with a simple question. 
DO NOT use placeholders like [Your Name] or [Company Name]. Sign off the email using the Sender Name provided above.

Return ONLY valid JSON with no markdown:
{{ "subject": "...", "body": "..." }}
"""
