// frontend/utils/hotelApi.js - API Hôtel (chambres, réservations, petit-déj, restauration, spa, offres)
import { getApiBaseUrl } from './getApiUrl';

const API_URL = getApiBaseUrl();
// UUID par défaut (migration seed_default_hotel_fixed_id) - utilisé si NEXT_PUBLIC_HOTEL_ID non défini
const DEFAULT_HOTEL_UUID = 'b2178a5e-9a4f-4c8d-9e1b-2a3c4d5e6f70';
const HOTEL_ID = process.env.NEXT_PUBLIC_HOTEL_ID || DEFAULT_HOTEL_UUID;

const qs = (params) => {
  const p = new URLSearchParams();
  p.set('hotel_id', params?.hotel_id || HOTEL_ID);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (k !== 'hotel_id' && v != null && v !== '') p.set(k, v);
  });
  return p.toString();
};

const get = async (path, params = {}) => {
  const query = qs(params);
  const baseUrl = `${API_URL}/hotel${path}`;
  const url = query ? `${baseUrl}?${query}` : baseUrl;
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

const post = async (path, body) => {
  const url = `${API_URL}/hotel${path}`;
  const token = typeof window !== 'undefined' && (localStorage.getItem('authToken') || localStorage.getItem('auth_token'));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ ...body, hotel_id: body?.hotel_id || HOTEL_ID }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

const put = async (path, body = {}) => {
  const url = `${API_URL}/hotel${path}`;
  const token = typeof window !== 'undefined' && (localStorage.getItem('authToken') || localStorage.getItem('auth_token'));
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

export const hotelApi = {
  getHotel: (hotelId) => get('', { hotel_id: hotelId || HOTEL_ID }),
  getRooms: (hotelId) => get('/rooms', { hotel_id: hotelId || HOTEL_ID }),
  getRoom: (id) => get(`/rooms/${id}`),
  getAvailability: (checkIn, checkOut, roomTypeId, hotelId) =>
    get('/rooms/availability', { check_in: checkIn, check_out: checkOut, room_type_id: roomTypeId || '', hotel_id: hotelId || HOTEL_ID }),
  getAmenities: (type, hotelId) => get('/amenities', { type: type || '', hotel_id: hotelId || HOTEL_ID }),
  getDining: (hotelId) => get('/dining', { hotel_id: hotelId || HOTEL_ID }),
  getWellness: (hotelId) => get('/wellness', { hotel_id: hotelId || HOTEL_ID }),
  getGallery: (category, hotelId) => get('/gallery', { category: category || '', hotel_id: hotelId || HOTEL_ID }),
  getOffers: (hotelId) => get('/offers', { hotel_id: hotelId || HOTEL_ID }),
  createReservation: (data) => post('/reservations', data),
  getMyReservations: () => get('/reservations/my'),
  getReservation: (id) => get(`/reservations/${id}`),
  cancelReservation: (id) => put(`/reservations/${id}/cancel`),
};
