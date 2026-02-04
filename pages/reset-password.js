// frontend/pages/reset-password.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getApiBaseUrl } from '../utils/getApiUrl';

const API_URL = getApiBaseUrl();

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token manquant. Veuillez utiliser le lien reçu par email.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      setSuccess(true);
      
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        router.push('/login?message=password-reset-success');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Réinitialiser mon mot de passe - LE SAGE DEV</title>
      </Head>

      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <h1>🔐 Réinitialiser mon mot de passe</h1>
            <p>Créez un nouveau mot de passe pour votre compte</p>
          </div>

          {success ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Mot de passe réinitialisé !</h2>
              <p>Votre mot de passe a été modifié avec succès.</p>
              <p className="redirect-text">Redirection vers la page de connexion...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reset-form">
              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  required
                  disabled={loading || !token}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  disabled={loading || !token}
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading || !token}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser mon mot de passe'}
              </button>

              <div className="form-footer">
                <Link href="/login" className="link-back">
                  ← Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .reset-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .reset-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          backdrop-filter: blur(10px);
        }

        .reset-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .reset-header h1 {
          color: white;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #00D9FF, #0066FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .reset-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .reset-form {
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

        .redirect-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-style: italic;
          margin-top: 16px;
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
          .reset-card {
            padding: 24px;
          }

          .reset-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}