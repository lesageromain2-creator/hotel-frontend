/**
 * Envoi d'emails d'authentification (Better Auth)
 * Utilise Resend - RESEND_API_KEY et EMAIL_FROM requis
 * Compte gratuit : https://resend.com (100 emails/jour)
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Hôtel La Grande Croix";

const isConfigured = !!RESEND_API_KEY && !!EMAIL_FROM;

function logEmailNotConfigured(type: string, to: string) {
  if (!isConfigured) {
    console.warn(
      `[sendAuthEmail] ⚠️ Email non envoyé (${type}) : RESEND_API_KEY ou EMAIL_FROM manquant. ` +
        `Ajoutez-les dans .env.local et sur Vercel. ` +
        `Compte Resend gratuit : https://resend.com | Destinataire: ${to}`
    );
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logEmailNotConfigured("RESEND_API_KEY manquant", to);
    return false;
  }
  const fromEmail = (EMAIL_FROM || "").trim();
  if (!fromEmail) {
    console.warn("[sendAuthEmail] ⚠️ EMAIL_FROM manquant. Ajoutez-le dans .env.local / Vercel.");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[sendAuthEmail] Resend API error:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[sendAuthEmail] Erreur envoi:", e);
    return false;
  }
}

export async function sendResetPasswordEmail(to: string, url: string) {
  const subject = "Réinitialisation de votre mot de passe";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, sans-serif; background: #1A1A1A; color: #FAFAF8; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="color: #C9A96E;">Réinitialisation du mot de passe</h2>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p><a href="${url}" style="display: inline-block; background: #C9A96E; color: #1A1A1A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Réinitialiser mon mot de passe</a></p>
    <p style="color: #8B8680; font-size: 12px;">Ce lien expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    <p style="margin-top: 24px;">— ${APP_NAME}</p>
  </div>
</body>
</html>`;
  const ok = await sendViaResend(to, subject, html);
  if (!ok) {
    logEmailNotConfigured("reset password", to);
    console.log("[DEV] Reset password URL (si Resend non configuré):", url);
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  const subject = "Vérifiez votre adresse email";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, sans-serif; background: #1A1A1A; color: #FAFAF8; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h2 style="color: #C9A96E;">Vérification de votre email</h2>
    <p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour vérifier votre adresse email.</p>
    <p><a href="${url}" style="display: inline-block; background: #C9A96E; color: #1A1A1A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Vérifier mon email</a></p>
    <p style="color: #8B8680; font-size: 12px;">Ce lien expire sous 24 heures.</p>
    <p style="margin-top: 24px;">— ${APP_NAME}</p>
  </div>
</body>
</html>`;
  const ok = await sendViaResend(to, subject, html);
  if (!ok) {
    logEmailNotConfigured("vérification email", to);
    console.log("[DEV] Verification URL (si Resend non configuré):", url);
  }
}
