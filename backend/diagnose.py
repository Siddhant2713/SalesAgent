"""Quick diagnostic — run this to find the exact error location."""
import sys
sys.path.insert(0, ".")

# Test 1: Check encryption
print("=== Test 1: Encryption ===")
from utils.encryption import decrypt, encrypt
print(f"decrypt(None) = {repr(decrypt(None))}")
print(f"decrypt('') = {repr(decrypt(''))}")
print(f"decrypt('AIzaTest123') = {repr(decrypt('AIzaTest123'))}")

# Test 2: Check genai Client with empty key
print("\n=== Test 2: genai.Client ===")
from google import genai
try:
    client = genai.Client(api_key="")
    print("Empty key client: OK")
except Exception as e:
    print(f"Empty key client ERROR: {type(e).__name__}: {e}")

try:
    client = genai.Client(api_key=None)
    print("None key client: OK")
except Exception as e:
    print(f"None key client ERROR: {type(e).__name__}: {e}")

# Test 3: Check GoogleSearch type
print("\n=== Test 3: GoogleSearch ===")
from google.genai import types
try:
    tool = types.Tool(google_search=types.GoogleSearch())
    print(f"GoogleSearch tool: OK - {tool}")
except Exception as e:
    print(f"GoogleSearch ERROR: {type(e).__name__}: {e}")

# Test 4: Check GenerateContentConfig with GoogleSearch
print("\n=== Test 4: Config with GoogleSearch ===")
try:
    config = types.GenerateContentConfig(
        temperature=0.4,
        max_output_tokens=512,
        response_mime_type="application/json",
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    print(f"Config with GoogleSearch: OK")
except Exception as e:
    print(f"Config ERROR: {type(e).__name__}: {e}")

# Test 5: Check system_instruction
print("\n=== Test 5: System Instruction ===")
from utils.prompts import SYSTEM_PROMPT
print(f"SYSTEM_PROMPT type: {type(SYSTEM_PROMPT)}, len: {len(SYSTEM_PROMPT)}")

# Test 6: Check full generate call (will fail without real key, but shows WHERE it fails)
print("\n=== Test 6: Full generate call ===")
try:
    client = genai.Client(api_key="AIzaFAKEKEYFORTESTINGONLY12345")
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.7,
        max_output_tokens=2048,
        response_mime_type="application/json",
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="test",
        config=config,
    )
except Exception as e:
    print(f"Generate ERROR: {type(e).__name__}: {e}")

print("\n=== Done ===")
