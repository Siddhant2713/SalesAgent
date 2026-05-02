import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str, current_user) -> None:
    """
    Send a plain-text email via SMTP using user-specific credentials.
    Raises smtplib.SMTPException on failure.
    Body is sent as plain text only (no HTML in V1).
    """
    msg = MIMEMultipart()
    from_name = current_user.smtp_from_name or "SalesAgent"
    msg["From"] = f"{from_name} <{current_user.smtp_username}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    logger.info(f"Sending email to {to_email} on behalf of user {current_user.id}")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(current_user.smtp_username, current_user.smtp_password)
        server.sendmail(current_user.smtp_username, to_email, msg.as_string())
