from typing import Optional
import os
import aiosmtplib # type: ignore
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration email
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "slaouihza2@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "tjkt xblv tiyd tgce")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    is_html: bool = True
):
    """Envoie un email de manière asynchrone"""
    message = MIMEMultipart()
    message["From"] = FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    
    message.attach(MIMEText(body, "html" if is_html else "plain"))
    
    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
        )
        return True
    except Exception as e:
        print(f"Erreur envoi email: {e}")
        return False


async def send_verification_email(email: str, verification_token: str):
    """Envoie l'email de vérification"""
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    
    html_body = f"""
    <html>
        <body>
            <h2>Vérifiez votre adresse email</h2>
            <p>Merci de vous être inscrit ! Veuillez cliquer sur le lien ci-dessous pour vérifier votre email :</p>
            <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon email</a></p>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p>{verification_link}</p>
            <p>Ce lien expire dans 24 heures.</p>
        </body>
    </html>
    """
    
    await send_email(
        to_email=email,
        subject="Vérifiez votre adresse email",
        body=html_body,
        is_html=True
    )


async def send_password_reset_email(email: str, reset_token: str):
    """Envoie l'email de réinitialisation du mot de passe"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_body = f"""
    <html>
        <body>
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
            <p><a href="{reset_link}" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p>{reset_link}</p>
            <p>Ce lien expire dans 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </body>
    </html>
    """
    
    await send_email(
        to_email=email,
        subject="Réinitialisation de votre mot de passe",
        body=html_body,
        is_html=True
    )