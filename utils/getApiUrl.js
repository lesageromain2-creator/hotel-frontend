/**
 * Retourne l'URL de base de l'API backend.
 * En production (HTTPS), force HTTPS pour éviter Mixed Content.
 */
export function getApiBaseUrl() {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://') && !url.includes('localhost')) {
    url = url.replace('http://', 'https://');
  }
  return url.replace(/\/$/, '');
}
