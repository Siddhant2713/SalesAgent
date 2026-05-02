"""
Symmetric encryption for sensitive user credentials stored in the database.

Uses Fernet (AES-128-CBC with HMAC-SHA256) from the cryptography library.
Requires ENCRYPTION_KEY in .env — generate with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

Falls back to plaintext if ENCRYPTION_KEY is not set (development mode).
"""

import os
import logging

logger = logging.getLogger(__name__)

_ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
_fernet = None

if _ENCRYPTION_KEY:
    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(_ENCRYPTION_KEY.encode())
        logger.info("Encryption enabled for credential storage.")
    except Exception as e:
        logger.warning(f"Failed to initialize encryption: {e}. Falling back to plaintext.")
else:
    logger.warning(
        "ENCRYPTION_KEY not set. Credentials will be stored in plaintext. "
        "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    )


def encrypt(value: str) -> str:
    """Encrypt a string value. Returns ciphertext, or plaintext if encryption is not configured."""
    if not value:
        return value or ""
    if _fernet:
        return _fernet.encrypt(value.encode()).decode()
    return value


def decrypt(value: str) -> str:
    """Decrypt a string value. Returns plaintext. Handles already-plaintext values gracefully."""
    if not value:
        return value or ""
    if _fernet:
        try:
            return _fernet.decrypt(value.encode()).decode()
        except Exception:
            # Value was stored before encryption was enabled — return as-is
            return value
    return value
