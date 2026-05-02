def get_followup_tone(initial_tone: str) -> str:
    """
    Determine follow-up tone based on initial tone:
    - friendly -> curiosity
    - direct -> friendly
    - curiosity -> direct
    """
    mapping = {
        "friendly": "curiosity",
        "direct": "friendly",
        "curiosity": "direct"
    }
    return mapping.get(initial_tone, "friendly")
