# Configuration Vercel - Production

Pour que l'app fonctionne en production sur `https://hotel-demo-murex.vercel.app` :

## Variables d'environnement (Vercel Dashboard → Settings → Environment Variables)

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | **https://votre-backend.onrender.com** (URL du backend déployé sur Render) | Oui |
| `NEXT_PUBLIC_APP_URL` | `https://hotel-demo-murex.vercel.app` | Oui |
| `BETTER_AUTH_URL` | `https://hotel-demo-murex.vercel.app` | Oui |
| `BETTER_AUTH_SECRET` | Générer avec `openssl rand -base64 32` | Oui |
| `BETTER_AUTH_BACKEND_SECRET` | Même valeur que `JWT_SECRET` du backend | Oui (pour JWT) |
| `GOOGLE_CLIENT_ID` | Votre Client ID Google OAuth | Optionnel |
| `GOOGLE_CLIENT_SECRET` | Votre Client Secret Google OAuth | Optionnel |
| `JWT_SECRET` | Même valeur que le backend | Oui (pour backend-token) |

## Erreurs courantes

1. **Mixed Content (http vs https)** : `NEXT_PUBLIC_API_URL` doit commencer par `https://` en production.
2. **Backend inaccessible** : 
   - Déployez le backend sur Render (ou autre)
   - Ajoutez son URL dans `NEXT_PUBLIC_API_URL`
   - Configurez CORS sur le backend pour autoriser `https://hotel-demo-murex.vercel.app`

## Backend (Render) - Variables d'environnement

Sur Render, ajoutez dans votre service backend :

| Variable | Valeur |
|----------|--------|
| `ALLOWED_ORIGINS` | `https://hotel-demo-murex.vercel.app,http://localhost:3000` |

Le backend utilise déjà des patterns pour autoriser `*.vercel.app`. Si ça ne suffit pas, ajoutez explicitement votre URL dans `ALLOWED_ORIGINS`.
