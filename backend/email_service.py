import os
import smtplib
import ssl
from email.message import EmailMessage


def smtp_is_configured() -> bool:
    host = os.environ.get("SMTP_HOST", "").strip()
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    sender = os.environ.get("SMTP_FROM_EMAIL", username).strip()
    placeholder_passwords = {
        "",
        "PUT_YOUR_GMAIL_APP_PASSWORD_HERE",
        "YOUR_GMAIL_APP_PASSWORD",
    }
    return bool(host and username and sender and password not in placeholder_passwords)


def _smtp_config():
    host = os.environ.get("SMTP_HOST", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    sender = os.environ.get("SMTP_FROM_EMAIL", username).strip()
    use_tls = os.environ.get("SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes")
    return host, port, username, password, sender, use_tls


def send_email(to_email: str, subject: str, body_text: str):
    host, port, username, password, sender, use_tls = _smtp_config()
    if not smtp_is_configured():
        raise RuntimeError("SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL")

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body_text)

    if use_tls:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=20) as server:
            server.starttls(context=context)
            server.login(username, password)
            server.send_message(msg)
    else:
        with smtplib.SMTP_SSL(host, port, timeout=20) as server:
            server.login(username, password)
            server.send_message(msg)


def send_verification_code(to_email: str, username: str, code: str):
    subject = "Verify your LuaYou account"
    body = (
        f"Hi {username},\n\n"
        f"Your LuaYou verification code is: {code}\n\n"
        "This code expires in 15 minutes.\n"
        "If you didn't request this, you can ignore this email.\n"
    )
    send_email(to_email, subject, body)


def send_welcome_email(to_email: str, username: str):
    subject = "Welcome to LuaYou"
    body = (
        f"Welcome {username}!\n\n"
        "Your email has been verified and your LuaYou account is ready.\n"
        "Start learning and have fun leveling up.\n"
    )
    send_email(to_email, subject, body)


def send_password_reset_code(to_email: str, username: str, code: str):
    subject = "LuaYou password reset code"
    body = (
        f"Hi {username},\n\n"
        f"Your password reset code is: {code}\n\n"
        "This code expires in 15 minutes.\n"
        "If you didn't request this, you can ignore this email.\n"
    )
    send_email(to_email, subject, body)
