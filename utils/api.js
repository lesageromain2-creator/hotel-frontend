// frontend/utils/api.js - VERSION JWT AVEC LOGS AMÉLIORÉS

import { getApiBaseUrl } from './getApiUrl';

const API_URL = getApiBaseUrl();

if (typeof window === 'undefined') {
  console.log('🔧 Configuration API:', API_URL);
}

// ============================================
// GESTION DU TOKEN JWT
// ============================================

const TOKEN_KEY = 'authToken';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  console.log('✅ Token sauvegardé');
};

const removeToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  console.log('🗑️ Token supprimé');
};

// ============================================
// FONCTION FETCH API (AMÉLIORÉE)
// ============================================

const fetchAPI = async (endpoint, options = {}) => {
  let token = getToken();

  // Utilisateur connecté via Better Auth (Google) sans JWT backend : échanger session → JWT
  if (!token && typeof window !== 'undefined') {
    try {
      const r = await fetch(`${window.location.origin}/api/backend-token`, { credentials: 'include' });
      const data = await r.json();
      if (data.token) {
        setToken(data.token);
        token = data.token;
      }
    } catch (_) {}
  }

  const url = `${API_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    console.log('  🔑 Token:', token ? '✓ présent' : '✗ absent');
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
      console.log('📦 Data:', data);
    } catch (parseError) {
      const fallback =
        response.status === 401
          ? 'Non authentifié'
          : response.status === 404
            ? 'Non trouvé'
            : 'Réponse invalide du serveur';
      console.error('❌ Erreur parsing JSON:', parseError);
      throw new Error(fallback);
    }

    // Si le token est expiré, déconnecter
    if (response.status === 401 && data?.error?.includes('Token')) {
      console.warn('⚠️ Token expiré - Déconnexion');
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Erreur serveur (${response.status})`;
      console.error('❌ Erreur API:', {
        status: response.status,
        endpoint,
        error: errorMsg,
        details: data
      });
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Erreur réseau ou autre
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Erreur réseau:', {
        message: 'Impossible de contacter le serveur',
        url,
        suggestion: 'Vérifiez que le backend est démarré sur ' + API_URL
      });
      throw new Error('Serveur inaccessible. Vérifiez que le backend est démarré.');
    }
    
    console.error('❌ Erreur fetch:', {
      message: error.message,
      endpoint,
      url
    });
    throw error;
  }
};

// ============================================
// AUTH API - VERSION JWT
// ============================================

export const login = async (credentials) => {
  console.log('🔐 Tentative de connexion...');
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  if (data.token) {
    setToken(data.token);
    console.log('✅ Connexion réussie');
  }
  
  return data;
};

export const register = async (userData) => {
  console.log('📝 Tentative d\'inscription...');
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (data.token) {
    setToken(data.token);
    console.log('✅ Inscription réussie');
  }
  
  return data;
};

export const logout = async () => {
  console.log('👋 Déconnexion...');
  try {
    await fetchAPI('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Erreur logout:', error);
  } finally {
    removeToken();
    console.log('✅ Déconnexion terminée');
  }
};

export const checkAuth = async () => {
  const token = getToken();
  
  if (!token) {
    console.log('❌ Pas de token - Non authentifié');
    return { 
      authenticated: false,
      user: null 
    };
  }
  
  try {
    console.log('🔍 Vérification authentification...');
    const response = await fetchAPI('/auth/me');
    console.log('✅ Authentifié:', response.user?.email);
    return {
      authenticated: true,
      user: response.user
    };
  } catch (error) {
    console.log('❌ Token invalide - Déconnexion');
    removeToken();
    return { 
      authenticated: false,
      user: null 
    };
  }
};

export const refreshToken = async () => {
  try {
    const data = await fetchAPI('/auth/refresh', {
      method: 'POST',
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  } catch (error) {
    removeToken();
    throw error;
  }
};

// ============================================
// USERS API
// ============================================

export const updateUserProfile = async (userData) => {
  return fetchAPI('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const changePassword = async (passwordData) => {
  return fetchAPI('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
};

export const deleteAccount = async () => {
  return fetchAPI('/users/profile', {
    method: 'DELETE',
  });
};

export const getUserProfile = async () => {
  return fetchAPI('/users/profile');
};

export const updateProfile = async (userData) => {
  return fetchAPI('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const getUserStats = async () => {
  return fetchAPI('/users/stats');
};


export const getUserMessages = async () => {
  console.log('📬 Récupération messages utilisateur...');
  return fetchAPI('/users/messages'); // ✅ CORRECT (pas besoin de /api car déjà dans API_URL)
};

// Autres fonctions users existantes...
// ============================================
// SETTINGS API
// ============================================

export const fetchSettings = async () => {
  console.log('⚙️ Récupération des paramètres...');
  return fetchAPI('/settings');
};

export const fetchSetting = async (key) => {
  return fetchAPI(`/settings/${key}`);
};

export const updateSetting = async (key, value) => {
  return fetchAPI(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
};

export const createSetting = async (key, value, type, description) => {
  return fetchAPI('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value, type, description }),
  });
};

export const deleteSetting = async (key) => {
  return fetchAPI(`/settings/${key}`, {
    method: 'DELETE',
  });
};

// ============================================
// DISHES API
// ============================================

export const fetchDishes = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/dishes${queryString ? `?${queryString}` : ''}`);
};

export const fetchDishById = async (id) => {
  return fetchAPI(`/dishes/${id}`);
};

export const searchDishes = async (query) => {
  return fetchAPI(`/dishes/search?q=${encodeURIComponent(query)}`);
};

// ============================================
// CATEGORIES API
// ============================================

export const fetchCategories = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/categories${queryString ? `?${queryString}` : ''}`);
};

export const fetchCategoryById = async (id) => {
  return fetchAPI(`/categories/${id}`);
};

export const fetchDishesByCategory = async (categoryId) => {
  return fetchAPI(`/categories/${categoryId}/dishes`);
};

// ============================================
// MENUS API
// ============================================

export async function fetchMenus() {
  return fetchAPI('/menus');
}

export async function fetchMenuById(id) {
  const response = await fetchAPI(`/menus/${id}`);
  return response.menu;
}

export async function fetchMenusByType(type) {
  return fetchAPI(`/menus/type/${type}`);
}

export async function createMenu(menuData) {
  return fetchAPI('/menus', {
    method: 'POST',
    body: JSON.stringify(menuData),
  });
}

export async function updateMenu(id, menuData) {
  return fetchAPI(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuData),
  });
}

export async function deleteMenu(id) {
  return fetchAPI(`/menus/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// RESERVATIONS API
// ============================================

export const createReservation = async (reservationData) => {
  try {
    console.log('📝 Création réservation avec:', reservationData);
    
    const data = await fetchAPI('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
    
    console.log('✅ Réservation créée:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur création réservation:', error);
    throw error;
  }
};

export const getMyReservations = async () => {
  try {
    const data = await fetchAPI('/reservations/my');
    return data.reservations || [];
  } catch (error) {
    console.error('Erreur getMyReservations:', error);
    return [];
  }
};

export const getReservationById = async (id) => {
  try {
    const data = await fetchAPI(`/reservations/${id}`);
    return data.reservation;
  } catch (error) {
    console.error('Erreur getReservationById:', error);
    throw error;
  }
};

export const getMyProjects = async () => {
  try {
    const data = await fetchAPI('/dashboard/projects');
    return data.projects || data || [];
  } catch (e) {
    return [];
  }
};

export const cancelReservation = async (id) => {
  try {
    const data = await fetchAPI(`/reservations/${id}/cancel`, {
      method: 'PUT',
    });
    return data;
  } catch (error) {
    console.error('Erreur cancelReservation:', error);
    throw error;
  }
};

export const checkAvailability = async (reservationData) => {
  try {
    const data = await fetchAPI('/reservations/check-availability', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
    return data;
  } catch (error) {
    console.error('Erreur checkAvailability:', error);
    throw error;
  }
};

export const fetchUserReservations = async () => {
  return fetchAPI('/reservations/my');
};

export const fetchReservationById = async (id) => {
  return fetchAPI(`/reservations/${id}`);
};

export const updateReservation = async (id, reservationData) => {
  return fetchAPI(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reservationData),
  });
};

export const deleteReservation = async (id) => {
  return fetchAPI(`/reservations/${id}`, {
    method: 'DELETE',
  });
};

// ============================================
// FAVORITES API
// ============================================

export const fetchFavorites = async () => {
  const response = await fetchAPI('/favorites');
  return {
    favorites: Array.isArray(response) ? response : (response.favorites || [])
  };
};

export const addFavorite = async (dishId) => {
  return fetchAPI('/favorites', {
    method: 'POST',
    body: JSON.stringify({ dishId }),
  });
};

export const removeFavorite = async (dishId) => {
  return fetchAPI(`/favorites/${dishId}`, {
    method: 'DELETE',
  });
};

export const checkIsFavorite = async (dishId) => {
  const response = await fetchAPI(`/favorites/check/${dishId}`);
  return response.isFavorite;
};

export const getFavoritesCount = async () => {
  const response = await fetchAPI('/favorites/count');
  return response.count;
};

// ============================================
// REVIEWS API
// ============================================

export const createReview = async (dishId, reviewData) => {
  return fetchAPI('/reviews', {
    method: 'POST',
    body: JSON.stringify({ dishId, ...reviewData }),
  });
};

export const fetchUserReviews = async () => {
  return fetchAPI('/reviews/my');
};

export const fetchDishReviews = async (dishId) => {
  return fetchAPI(`/reviews/dish/${dishId}`);
};

export const updateReview = async (reviewId, reviewData) => {
  return fetchAPI(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });
};

export const deleteReview = async (reviewId) => {
  return fetchAPI(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
};

// ============================================
// LOYALTY POINTS API
// ============================================

export const getLoyaltyPoints = async () => {
  return fetchAPI('/loyalty/points');
};

export const getLoyaltyHistory = async () => {
  return fetchAPI('/loyalty/history');
};

export const redeemPoints = async (rewardId) => {
  return fetchAPI('/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify({ rewardId }),
  });
};

// ============================================
// CONTACT API
// ============================================

export const sendContactMessage = async (messageData) => {
  return fetchAPI('/contact', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};


// ============================================
// ADMIN API
// ============================================

// Contact Messages
export const getAdminContactMessages = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/contact${queryString ? `?${queryString}` : ''}`); // ✅ CORRECT
};

export const getAdminContactMessage = async (id) => {
  return fetchAPI(`/admin/contact/${id}`);
};

export const updateAdminContactMessage = async (id, data) => {
  return fetchAPI(`/admin/contact/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const replyToContactMessage = async (id, reply_text) => {
  return fetchAPI(`/admin/contact/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply_text }),
  });
};

export const deleteContactMessage = async (id, permanent = false) => {
  return fetchAPI(`/admin/contact/${id}?permanent=${permanent}`, {
    method: 'DELETE',
  });
};

export const getContactMessagesStats = async () => {
  return fetchAPI('/admin/contact/stats/overview');
};

// Projects
export const getAdminProjects = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/projects${queryString ? `?${queryString}` : ''}`);
};

export const getAdminProject = async (id) => {
  return fetchAPI(`/admin/projects/${id}`);
};

export const updateAdminProject = async (id, data) => {
  return fetchAPI(`/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const createAdminProject = async (projectData) => {
  return fetchAPI('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
};

export const deleteAdminProject = async (id) => {
  return fetchAPI(`/admin/projects/${id}`, {
    method: 'DELETE',
  });
};

export const getAdminClients = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/dashboard/users${queryString ? `?${queryString}` : ''}`);
};

export const createProjectTask = async (projectId, taskData) => {
  return fetchAPI(`/admin/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

export const updateProjectTask = async (taskId, taskData) => {
  return fetchAPI(`/admin/projects/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
};

export const deleteProjectTask = async (taskId) => {
  return fetchAPI(`/admin/projects/tasks/${taskId}`, {
    method: 'DELETE',
  });
};

export const createProjectMilestone = async (projectId, milestoneData) => {
  return fetchAPI(`/admin/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(milestoneData),
  });
};

export const updateProjectMilestone = async (milestoneId, milestoneData) => {
  return fetchAPI(`/admin/projects/milestones/${milestoneId}`, {
    method: 'PUT',
    body: JSON.stringify(milestoneData),
  });
};

export const addProjectComment = async (projectId, comment, is_internal = false) => {
  return fetchAPI(`/admin/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment, is_internal }),
  });
};

export const getProjectsStats = async () => {
  return fetchAPI('/admin/projects/stats/overview');
};

// Reservations
export const getAdminReservations = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/reservations${queryString ? `?${queryString}` : ''}`);
};

export const getAdminReservation = async (id) => {
  return fetchAPI(`/admin/reservations/${id}`);
};

export const updateAdminReservation = async (id, data) => {
  return fetchAPI(`/admin/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAdminReservation = async (id) => {
  return fetchAPI(`/admin/reservations/${id}`, {
    method: 'DELETE',
  });
};

export const createAdminReservation = async (reservationData) => {
  return fetchAPI('/admin/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData),
  });
};

export const getReservationsCalendar = async (month, year) => {
  return fetchAPI(`/admin/reservations/calendar/view?month=${month}&year=${year}`);
};

export const getReservationsStats = async () => {
  return fetchAPI('/admin/reservations/stats/overview');
};

// Dashboard
export const getAdminDashboard = async () => {
  return fetchAPI('/admin/dashboard');
};

export const getRevenueStats = async () => {
  return fetchAPI('/admin/dashboard/stats/revenue');
};

export const getActivityLogs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/dashboard/activity-logs${queryString ? `?${queryString}` : ''}`);
};

export const getAdminUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/dashboard/users${queryString ? `?${queryString}` : ''}`);
};

export const getAdminUserDetails = async (userId) => {
  return fetchAPI(`/admin/dashboard/users/${userId}`);
};

export const sendUserNotification = async (notificationData) => {
  return fetchAPI('/admin/dashboard/notifications/send', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  });
};

export const adminSearch = async (query) => {
  return fetchAPI(`/admin/dashboard/search?q=${encodeURIComponent(query)}`);
};

// ============================================
// ADMIN HÔTEL (chambres, revenus, menus, users)
// ============================================
export const getAdminHotelUsers = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/hotel/users${q ? `?${q}` : ''}`);
};

export const updateAdminUserRole = async (userId, role) => {
  return fetchAPI(`/admin/hotel/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
};

export const getAdminRevenueForecast = async (hotelId) => {
  return fetchAPI(`/admin/hotel/revenue-forecast${hotelId ? `?hotel_id=${hotelId}` : ''}`);
};

export const getAdminRoomsAvailability = async (hotelId) => {
  return fetchAPI(`/admin/hotel/rooms/availability${hotelId ? `?hotel_id=${hotelId}` : ''}`);
};

export const updateAdminRoomType = async (id, data) => {
  return fetchAPI(`/admin/hotel/room-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const addAdminRoom = async (data) => {
  return fetchAPI('/admin/hotel/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteAdminRoom = async (id) => {
  return fetchAPI(`/admin/hotel/rooms/${id}`, { method: 'DELETE' });
};

export const getAdminWeeklyMenus = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/hotel/weekly-menus${q ? `?${q}` : ''}`);
};

export const createAdminWeeklyMenu = async (data) => {
  return fetchAPI('/admin/hotel/weekly-menus', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAdminWeeklyMenu = async (id, data) => {
  return fetchAPI(`/admin/hotel/weekly-menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const getAdminHotelReservations = async (hotelId) => {
  return fetchAPI(`/admin/hotel/reservations${hotelId ? `?hotel_id=${hotelId}` : ''}`);
};

// ============================================
// PROJECT FILES API
// ============================================

export const uploadProjectFile = async (projectId, fileData) => {
  return fetchAPI(`/admin/projects/${projectId}/files`, {
    method: 'POST',
    body: JSON.stringify(fileData),
  });
};

export const deleteProjectFile = async (fileId) => {
  return fetchAPI(`/admin/projects/files/${fileId}`, {
    method: 'DELETE',
  });
};

/** GET /admin/projects/:projectId/files — liste des fichiers */
export const getProjectFiles = async (projectId) => {
  return fetchAPI(`/admin/projects/${projectId}`).then(data => data.files || []);
};

/** POST multipart /admin/projects/:projectId/files — upload avec progression */
export const uploadProjectFiles = (projectId, files, { onProgress } = {}) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const url = `${API_URL}/admin/projects/${projectId}/files`;
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        try {
          const d = JSON.parse(xhr.responseText);
          reject(new Error(d.error || d.message || `Upload failed ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed ${xhr.status}`));
        }
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Erreur réseau')));
    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(fd);
  });
};

/** GET file download URL */
export const getProjectFileDownload = async (projectId, fileId) => {
  // Récupérer le fichier depuis les données du projet
  const data = await fetchAPI(`/admin/projects/${projectId}`);
  const file = data.files?.find(f => f.id === fileId);
  return file?.file_url || null;
};

/** DELETE /admin/projects/files/:fileId */
export const deleteProjectFileByProject = async (projectId, fileId) => {
  return fetchAPI(`/admin/projects/files/${fileId}`, { method: 'DELETE' });
};

export const sendProjectUpdate = async (projectId, updateData) => {
  return fetchAPI(`/admin/projects/${projectId}/update-message`, {
    method: 'POST',
    body: JSON.stringify(updateData),
  });
};

export const deleteProjectMilestone = async (milestoneId) => {
  return fetchAPI(`/admin/projects/milestones/${milestoneId}`, {
    method: 'DELETE',
  });
};

// ============================================
// BLOG API
// ============================================

export const getAllBlogPosts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/blog${queryString ? `?${queryString}` : ''}`);
};

export const getBlogPostBySlug = async (slug) => {
  return fetchAPI(`/api/blog/${slug}`);
};

export const getBlogCategories = async () => {
  return fetchAPI('/api/blog/categories');
};

export const getBlogTags = async () => {
  return fetchAPI('/api/blog/tags');
};

// Admin Blog
export const createBlogPost = async (postData) => {
  return fetchAPI('/api/blog', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const updateBlogPost = async (id, postData) => {
  return fetchAPI(`/api/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
};

export const deleteBlogPost = async (id) => {
  return fetchAPI(`/api/blog/${id}`, {
    method: 'DELETE',
  });
};

export const getAdminBlogPosts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/blog${queryString ? `?${queryString}` : ''}`);
};

export const getBlogStats = async () => {
  return fetchAPI('/admin/blog/stats');
};

// ============================================
// OFFERS API
// ============================================

export const getAllOffers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/offers${queryString ? `?${queryString}` : ''}`);
};

export const getOfferBySlug = async (slug) => {
  return fetchAPI(`/api/offers/${slug}`);
};

// Admin Offers
export const createOffer = async (offerData) => {
  return fetchAPI('/api/offers', {
    method: 'POST',
    body: JSON.stringify(offerData),
  });
};

export const updateOffer = async (id, offerData) => {
  return fetchAPI(`/api/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(offerData),
  });
};

export const deleteOffer = async (id) => {
  return fetchAPI(`/api/offers/${id}`, {
    method: 'DELETE',
  });
};

export const getAdminOffers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/offers${queryString ? `?${queryString}` : ''}`);
};

export const getOffersStats = async () => {
  return fetchAPI('/admin/offers/stats');
};

// ============================================
// TESTIMONIALS API
// ============================================

export const getAllTestimonials = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/api/testimonials${queryString ? `?${queryString}` : ''}`);
};

export const getTestimonialById = async (id) => {
  return fetchAPI(`/api/testimonials/${id}`);
};

// Admin Testimonials
export const createTestimonial = async (testimonialData) => {
  return fetchAPI('/api/testimonials', {
    method: 'POST',
    body: JSON.stringify(testimonialData),
  });
};

export const updateTestimonial = async (id, testimonialData) => {
  return fetchAPI(`/api/testimonials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(testimonialData),
  });
};

export const deleteTestimonial = async (id) => {
  return fetchAPI(`/api/testimonials/${id}`, {
    method: 'DELETE',
  });
};

export const getAdminTestimonials = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/testimonials${queryString ? `?${queryString}` : ''}`);
};

export const approveTestimonial = async (id) => {
  return fetchAPI(`/admin/testimonials/${id}/approve`, {
    method: 'PUT',
  });
};

export const getTestimonialsStats = async () => {
  return fetchAPI('/admin/testimonials/stats');
};

// ============================================
// NEWSLETTER API
// ============================================

export const subscribeNewsletter = async (email, name = null) => {
  return fetchAPI('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
};

export const unsubscribeNewsletter = async (email) => {
  return fetchAPI('/api/newsletter/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

// Admin Newsletter
export const getNewsletterSubscribers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/newsletter/subscribers${queryString ? `?${queryString}` : ''}`);
};

export const sendNewsletterEmail = async (emailData) => {
  return fetchAPI('/admin/newsletter/send', {
    method: 'POST',
    body: JSON.stringify(emailData),
  });
};

export const getNewsletterStats = async () => {
  return fetchAPI('/admin/newsletter/stats');
};

export const exportNewsletterSubscribers = async () => {
  return fetchAPI('/admin/newsletter/export');
};

// ============================================
// ADMIN LOGS API
// ============================================

export const getAdminActivityLogs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/logs/activity${queryString ? `?${queryString}` : ''}`);
};

export const getAdminAlerts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/admin/logs/alerts${queryString ? `?${queryString}` : ''}`);
};

export const resolveAlert = async (id) => {
  return fetchAPI(`/admin/logs/alerts/${id}/resolve`, {
    method: 'PUT',
  });
};

export const getLogsStats = async () => {
  return fetchAPI('/admin/logs/stats');
};

// ============================================
// MESSAGES / CHAT API (Pour chat admin-client)
// ============================================

export const getConversations = async () => {
  return fetchAPI('/admin/messages/conversations');
};

// Récupérer tous les messages d'un utilisateur spécifique (Admin)
export const getAdminUserMessages = async (userId) => {
  return fetchAPI(`/admin/messages/user/${userId}`);
};

// Récupérer les détails d'une conversation spécifique (par message ID)
export const getConversationMessages = async (messageId) => {
  return fetchAPI(`/admin/messages/conversations/${messageId}`);
};

// Envoyer un message à un utilisateur (Admin → Client notification)
export const sendMessageToUser = async (userId, message, title = null) => {
  return fetchAPI(`/admin/messages/user/${userId}/send`, {
    method: 'POST',
    body: JSON.stringify({ message, title }),
  });
};

export const getUserConversation = async () => {
  return fetchAPI('/messages/conversation');
};

export const sendMessageToAdmin = async (message) => {
  return fetchAPI('/messages/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

export const markMessagesAsRead = async (conversationId) => {
  return fetchAPI(`/messages/${conversationId}/mark-read`, {
    method: 'PUT',
  });
};

// ============================================
// CHAT API (Système de chat temps réel)
// ============================================

export const getChatConversations = async () => {
  return fetchAPI('/chat/conversations');
};

export const createChatConversation = async (data) => {
  return fetchAPI('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getChatMessages = async (conversationId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/chat/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`);
};

export const sendChatMessage = async (conversationId, message, messageType = 'text', fileUrl = null, fileName = null) => {
  return fetchAPI(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message, message_type: messageType, file_url: fileUrl, file_name: fileName }),
  });
};

export const markChatAsRead = async (conversationId) => {
  return fetchAPI(`/chat/conversations/${conversationId}/read`, {
    method: 'PUT',
  });
};

export const closeChatConversation = async (conversationId) => {
  return fetchAPI(`/chat/conversations/${conversationId}/close`, {
    method: 'PUT',
  });
};

export const getChatUnreadCount = async () => {
  return fetchAPI('/chat/unread-count');
};

export const getAdminChatConversations = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/chat/admin/all${queryString ? `?${queryString}` : ''}`);
};

/** Admin : créer ou récupérer une conversation avec un client (user_id = id du client). */
export const createAdminChatConversation = async (userId, subject = 'Discussion avec l\'équipe') => {
  return fetchAPI('/chat/admin/conversations', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, subject }),
  });
};

export const getChatStats = async () => {
  return fetchAPI('/chat/admin/stats');
};

// ============================================
// USER NOTIFICATIONS API
// ============================================

export const getUserNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return fetchAPI(`/users/notifications${queryString ? `?${queryString}` : ''}`);
};

export const markNotificationAsRead = async (id) => {
  return fetchAPI(`/users/notifications/${id}/read`, {
    method: 'PUT',
  });
};

export const markAllNotificationsAsRead = async () => {
  return fetchAPI('/users/notifications/read-all', {
    method: 'PUT',
  });
};

export const deleteNotification = async (id) => {
  return fetchAPI(`/users/notifications/${id}`, {
    method: 'DELETE',
  });
};

// ============================================
// PAYMENTS / STRIPE API
// ============================================

export const createPaymentIntent = async (paymentData) => {
  return fetchAPI('/api/payments/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};

export const createCheckoutSession = async (sessionData) => {
  return fetchAPI('/api/payments/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
};

export const getPaymentHistory = async () => {
  return fetchAPI('/api/payments/history');
};

export const getInvoice = async (invoiceId) => {
  return fetchAPI(`/api/payments/invoices/${invoiceId}`);
};

