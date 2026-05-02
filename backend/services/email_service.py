import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from utils.encryption import decrypt
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str, current_user) -> None:
    """
    Send a plain-text email via SMTP using user-specific credentials.
    All SMTP config comes from the user's settings — no global dependency.
    Raises smtplib.SMTPException on failure.
    """
    msg = MIMEMultipart()
    from_name = current_user.smtp_from_name or "SalesAgent"
    msg["From"] = f"{from_name} <{current_user.smtp_username}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    smtp_password = decrypt(current_user.smtp_password) if current_user.smtp_password else ""
    smtp_host = current_user.smtp_host or "smtp.gmail.com"
    smtp_port = current_user.smtp_port or 587
    
    logger.info(f"Sending email to {to_email} via {smtp_host}:{smtp_port} on behalf of user {current_user.id}")
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(current_user.smtp_username, smtp_password)
        server.sendmail(current_user.smtp_username, to_email, msg.as_string())

