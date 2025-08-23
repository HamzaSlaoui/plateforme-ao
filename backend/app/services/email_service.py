import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from pathlib import Path 
from jinja2 import Environment, FileSystemLoader, select_autoescape
from core.config import Config


TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


async def send_email(
    *,
    to: str,
    subject: str,
    template_name: str,
    context: dict | None = None,
) -> bool:
    template = jinja_env.get_template(template_name)
    html_body = template.render(context or {})
    
    message           = MIMEMultipart("alternative")
    message["From"]   = Config.FROM_EMAIL
    message["To"]     = to
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=Config.SMTP_HOST,
            port=Config.SMTP_PORT,
            start_tls=True,
            username=Config.SMTP_USERNAME,
            password=Config.SMTP_PASSWORD,
        )
        return True
    except Exception as exc:
        print(f"[send_email] erreur: {exc}")
        return False


async def send_verification_email(email: str, verification_token: str) -> bool:
    verification_link = (
        f"{Config.FRONTEND_URL}/verify-email?token={verification_token}"
    )

    return await send_email(
        to=email,
        subject="Vérifiez votre adresse e-mail",
        template_name="verify_email.html",
        context={
            "verification_link": verification_link,
        },
    )


# async def send_password_reset_email(email: str, reset_token: str):
#     """Envoie l'email de réinitialisation du mot de passe"""
#     reset_link = f"{Config.FRONTEND_URL}/reset-password?token={reset_token}"
    
#     html_body = f"""
#     <html>
#         <body>
#             <h2>Réinitialisation de votre mot de passe</h2>
#             <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
#             <p><a href="{reset_link}" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
#             <p>Ou copiez ce lien dans votre navigateur :</p>
#             <p>{reset_link}</p>
#             <p>Ce lien expire dans 1 heure.</p>
#             <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
#         </body>
#     </html>
#     """
    
#     await send_email(
#         to_email=email,
#         subject="Réinitialisation de votre mot de passe",
#         body=html_body,
#         is_html=True
#     )


