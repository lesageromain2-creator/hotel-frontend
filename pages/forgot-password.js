// frontend/pages/forgot-password.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getApiBaseUrl } from '../utils/getApiUrl';

const API_URL = getApiBaseUrl();

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mot de passe oublié - LE SAGE DEV</title>
      </Head>

      <div className="forgot-container">
        <div className="forgot-card">
          <div className="forgot-header">
            <h1>🔑 Mot de passe oublié ?</h1>
            <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>

          {success ? (
            <div className="success-message">
              <div className="success-icon">✉️</div>
              <h2>Email envoyé !</h2>
              <p>Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques instants.</p>
              <p className="info-text">Pensez à vérifier vos spams si vous ne voyez rien.</p>
              <Link href="/login" className="btn-back">← Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-form">
              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>

              <div className="form-footer">
                <Link href="/login" className="link-back">← Retour à la connexion</Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .forgot-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .forgot-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(10px);
        }

        .forgot-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .forgot-header h1 {
          color: white;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #00D9FF, #0066FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .forgot-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .form-group input {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          transition: all 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #0066FF;
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .btn-submit {
          padding: 14px 24px;
          background: linear-gradient(135deg, #0066FF, #00D9FF);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 102, 255, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px 16px;
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.3);
          border-radius: 8px;
          color: #FF6B6B;
          font-size: 14px;
        }

        .success-message {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .success-message h2 {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .success-message p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin-bottom: 8px;
        }

        .info-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          margin-top: 16px;
          margin-bottom: 24px;
        }

        .btn-back {
          display: inline-block;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .form-footer {
          text-align: center;
          margin-top: 16px;
        }

        .link-back {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          text-decoration: none;
          transition: color 0.3s;
        }

        .link-back:hover {
          color: #00D9FF;
        }

        @media (max-width: 768px) {
          .forgot-card {
            padding: 24px;
          }

          .forgot-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}