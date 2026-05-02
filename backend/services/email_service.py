import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str) -> None:
    """
    Send a plain-text email via SMTP.
    Raises smtplib.SMTPException on failure.
    Body is sent as plain text only (no HTML in V1).
    """
    msg = MIMEMultipart()
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_username}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    logger.info(f"Sending email to {to_email}")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_username, to_email, msg.as_string())
