// frontend/pages/dashboard.js - Espace client hôtel premium
'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MessageCircle,
  User,
  LogOut,
  Bed,
  CreditCard,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Edit3,
  Trash2,
  Send,
  Loader2,
  Sparkles,
  Moon,
  Sun,
  Bell,
  Shield,
  Gift,
  Star,
  MapPin,
  UtensilsCrossed,
  Heart,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnimeReveal from '../components/animations/AnimeReveal';
import {
  checkAuth,
  logout,
  fetchSettings,
  getMyReservations,
  cancelReservation,
  deleteReservation,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  createChatConversation,
  markChatAsRead,
  ensureBackendToken,
  getToken,
} from '../utils/api';
import { authClient } from '../lib/auth-client';
import { toast } from 'react-toastify';
import { DEFAULT_HOTEL } from '../lib/hotelConstants';
import { HOTEL_IMAGES } from '../lib/hotelImages';

const HERO_IMG = HOTEL_IMAGES.hotel[0]?.src || '/image-website/hotel1.jpg';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [expandedReservationId, setExpandedReservationId] = useState(null);

  // Réservations
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Chat concierge
  const [chatConversations, setChatConversations] = useState([]);
  const [chatSelectedConversation, setChatSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatNewMessage, setChatNewMessage] = useState('');
  const [chatLoadingMessages, setChatLoadingMessages] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatTabLoading, setChatTabLoading] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const chatPollingRef = useRef(null);

  useEffect(() => {
    loadUserData();
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations' && user) loadReservations();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'chats' && user) loadChatData();
    return () => {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
    };
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'chats' && chatSelectedConversation) {
      chatPollingRef.current = setInterval(() => loadChatMessages(chatSelectedConversation.id, true), 5000);
      return () => {
        if (chatPollingRef.current) clearInterval(chatPollingRef.current);
      };
    }
  }, [activeTab, chatSelectedConversation]);

  useEffect(() => {
    if (activeTab === 'chats') chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, chatMessages]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const betterAuthSession = await authClient.getSession();
      if (betterAuthSession?.data?.user) {
        const u = betterAuthSession.data.user;
        const nameParts = (u.name || '').trim().split(/\s+/);
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          firstname: nameParts[0] || u.email?.split('@')[0] || 'Client',
          lastname: nameParts.slice(1).join(' ') || '',
          avatar_url: u.image || null,
          role: 'client',
        });
        // Obtenir un JWT backend pour les API (réservations, chat, etc.)
        const hasToken = await ensureBackendToken();
        const settingsData = await fetchSettings().catch(() => ({}));
        setSettings(settingsData);
        if (hasToken || getToken()) {
          try {
            await loadReservationsForStats();
          } catch (_) {}
        }
      } else {
        const [authData, settingsData] = await Promise.all([checkAuth(), fetchSettings()]);
        if (!authData.authenticated || !authData.user) {
          router.push('/login?redirect=/dashboard');
          return;
        }
        setUser(authData.user);
        setSettings(settingsData);
        if (authData.authenticated && getToken()) {
          try {
            await loadReservationsForStats();
          } catch (_) {}
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      router.push('/login?redirect=/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadReservationsForStats = async () => {
    try {
      const data = await getMyReservations();
      const list = Array.isArray(data) ? data : (data?.reservations || []);
      setReservations(list);
    } catch (error) {
      setReservations([]);
    }
  };

  const loadReservations = async () => {
    try {
      setReservationsLoading(true);
      const data = await getMyReservations();
      const sorted = (Array.isArray(data) ? data : data?.reservations || []).sort((a, b) => {
        const dA = a.check_in_date || a.reservation_date;
        const dB = b.check_in_date || b.reservation_date;
        return new Date(dB) - new Date(dA);
      });
      setReservations(sorted);
    } catch (error) {
      toast.error('Erreur chargement des réservations');
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return;
    try {
      setCancellingId(id);
      await cancelReservation(id);
      await loadReservations();
      toast.success('Réservation annulée');
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (!confirm('Supprimer définitivement cette réservation ?')) return;
    try {
      setDeleteLoading(id);
      await deleteReservation(id);
      await loadReservations();
      toast.success('Réservation supprimée');
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStayStatus = (r) => {
    const checkIn = r.check_in_date ? new Date(r.check_in_date) : null;
    const checkOut = r.check_out_date ? new Date(r.check_out_date) : null;
    const now = new Date();
    if (!checkIn) return { label: 'À confirmer', color: 'text-amber-400' };
    if (checkOut && now > checkOut) return { label: 'Séjour passé', color: 'text-[#8B8680]' };
    if (checkIn && now >= checkIn && checkOut && now <= checkOut) return { label: 'En cours', color: 'text-emerald-400' };
    return { label: 'À venir', color: 'text-[#C9A96E]' };
  };

  const getCountdown = (r) => {
    const checkIn = r.check_in_date ? new Date(r.check_in_date) : null;
    const checkOut = r.check_out_date ? new Date(r.check_out_date) : null;
    const now = new Date();
    if (!checkIn) return null;
    if (now < checkIn) {
      const days = Math.ceil((checkIn - now) / (24 * 60 * 60 * 1000));
      return { text: `Check-in dans ${days} jour${days > 1 ? 's' : ''}`, type: 'checkin' };
    }
    if (checkOut && now < checkOut) {
      const days = Math.ceil((checkOut - now) / (24 * 60 * 60 * 1000));
      return { text: `Check-out dans ${days} jour${days > 1 ? 's' : ''}`, type: 'checkout' };
    }
    return null;
  };

  const nextStay = reservations
    .filter((r) => r.status !== 'cancelled' && r.status !== 'completed')
    .find((r) => {
      const checkIn = r.check_in_date ? new Date(r.check_in_date) : null;
      return checkIn && checkIn >= new Date();
    });

  const loadChatData = async () => {
    if (!user) return;
    try {
      setChatTabLoading(true);
      let convs = (await getChatConversations())?.conversations || [];
      if (convs.length === 0) {
        const created = await createChatConversation({
          subject: 'Concierge – Demande d\'assistance',
          initial_message: 'Bonjour, je souhaite contacter le concierge de l\'établissement.',
        });
        if (created?.conversation) convs = [created.conversation];
      }
      setChatConversations(convs);
      if (convs.length > 0) {
        setChatSelectedConversation(convs[0]);
        await loadChatMessages(convs[0].id);
      }
    } catch (err) {
      toast.error('Erreur chargement messagerie');
    } finally {
      setChatTabLoading(false);
    }
  };

  const loadChatMessages = async (conversationId, silent = false) => {
    try {
      if (!silent) setChatLoadingMessages(true);
      const data = await getChatMessages(conversationId);
      setChatMessages(data.messages || []);
      await markChatAsRead(conversationId);
    } catch (err) {
      if (!silent) toast.error('Erreur chargement des messages');
    } finally {
      if (!silent) setChatLoadingMessages(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatNewMessage.trim() || chatSending || !chatSelectedConversation) return;
    try {
      setChatSending(true);
      const result = await sendChatMessage(chatSelectedConversation.id, chatNewMessage);
      setChatMessages((prev) => [...prev, result.message]);
      setChatNewMessage('');
    } catch (err) {
      toast.error('Erreur envoi');
    } finally {
      setChatSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      await logout().catch(() => {});
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const siteName = settings.site_name || DEFAULT_HOTEL.name;
  const activeReservations = reservations.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
        <p className="mt-4 text-[#8B8680] font-body">Chargement de votre espace...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Accueil', icon: Sparkles },
    { id: 'reservations', label: 'Mes réservations', icon: Bed, badge: activeReservations.length },
    { id: 'chats', label: 'Concierge', icon: MessageCircle },
    { id: 'invoices', label: 'Facturation', icon: CreditCard },
    { id: 'checkin', label: 'Check-in digital', icon: Shield },
    { id: 'profile', label: 'Profil & préférences', icon: User },
  ];

  return (
    <>
      <Head>
        <title>Espace Client – {siteName}</title>
      </Head>
      <Header settings={settings} />

      <div className={`dashboard-hotel ${darkMode ? 'dark' : ''}`}>
        <div className="dashboard-hotel-bg" />
        <div className={`dashboard-hotel-container ${mounted ? 'mounted' : ''}`}>
          <aside className="dashboard-hotel-sidebar">
            <div className="sidebar-header">
              <div className="user-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" />
                ) : (
                  <span>{user?.firstname?.[0]}{user?.lastname?.[0] || '?'}</span>
                )}
              </div>
              <div className="user-info">
                <h3>{user?.firstname} {user?.lastname}</h3>
                <p>{user?.email}</p>
                <span className="user-badge">Client</span>
              </div>
            </div>

            <nav className="sidebar-nav">
              {navItems.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  className={`nav-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                  {badge > 0 && <span className="badge">{badge}</span>}
                </button>
              ))}
              <div className="nav-divider" />
              <button className="nav-item logout" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </nav>

            <div className="sidebar-footer">
              <button
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Mode sombre/clair"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </aside>

          <main className="dashboard-hotel-main">
            <header className="main-header">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl text-[#FAFAF8]">
                  {getGreeting()}, {user?.firstname}
                </h1>
                <p className="text-[#8B8680] mt-0.5 text-sm">Bienvenue dans votre espace client</p>
              </div>
              <div className="header-actions">
                <button
                  className="btn-express"
                  onClick={() => { setActiveTab('chats'); }}
                >
                  <Sparkles size={14} />
                  Concierge
                </button>
                <Link href="/reservation-chambre" className="btn-primary-dash">
                  <Bed size={14} />
                  Réserver
                </Link>
              </div>
            </header>

            {/* Accueil premium */}
            {activeTab === 'overview' && (
              <div className="content-section">
                <AnimeReveal options={{ delay: 0, duration: 600 }} className="hero-immersive">
                  <div className="hero-image-wrap">
                    <Image src={HERO_IMG} alt={siteName} fill className="object-cover" priority sizes="100vw" />
                    <div className="hero-overlay" />
                    <div className="hero-content">
                      <p className="hero-tagline">{siteName}</p>
                      <h2 className="font-heading text-2xl md:text-3xl text-white">
                        Votre séjour, notre priorité
                      </h2>
                    </div>
                  </div>
                </AnimeReveal>

                {nextStay && (
                  <AnimeReveal options={{ delay: 100, duration: 500 }} className="countdown-card">
                    <div className="countdown-content">
                      <span className="countdown-label">Prochain séjour</span>
                      <p className="font-heading text-xl text-[#FAFAF8]">
                        {nextStay.room_type_name || 'Chambre'}
                      </p>
                      <p className="text-[#8B8680] text-sm">
                        {nextStay.check_in_date && new Date(nextStay.check_in_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {nextStay.check_out_date && ` → ${new Date(nextStay.check_out_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                      </p>
                      {getCountdown(nextStay) && (
                        <span className="countdown-badge">{getCountdown(nextStay).text}</span>
                      )}
                    </div>
                    <button
                      className="btn-detail"
                      onClick={() => { setActiveTab('reservations'); setExpandedReservationId(nextStay.id); }}
                    >
                      Détails <ChevronRight size={16} />
                    </button>
                  </AnimeReveal>
                )}

                <AnimeReveal options={{ delay: 150 }} className="overview-compact">
                  <div className="stats-row">
                    <button className="stat-pill" onClick={() => setActiveTab('reservations')}>
                      <Bed size={18} />
                      <span className="stat-pill-value">{activeReservations.length}</span>
                      <span className="stat-pill-label">Réservations</span>
                    </button>
                    <button className="stat-pill" onClick={() => setActiveTab('invoices')}>
                      <CreditCard size={18} />
                      <span className="stat-pill-value">Factures</span>
                    </button>
                    <button className="stat-pill" onClick={() => setActiveTab('chats')}>
                      <MessageCircle size={18} />
                      <span className="stat-pill-value">Concierge</span>
                    </button>
                  </div>
                  <div className="quick-links">
                    <Link href="/reservation-chambre" className="quick-link">
                      <Bed size={14} /> Réserver
                    </Link>
                    <button type="button" className="quick-link" onClick={() => setActiveTab('chats')}>
                      <MessageCircle size={14} /> Concierge
                    </button>
                    <Link href="/restauration" className="quick-link">
                      <UtensilsCrossed size={14} /> Restauration
                    </Link>
                    <Link href="/bien-etre" className="quick-link">
                      <Heart size={14} /> Spa
                    </Link>
                  </div>
                </AnimeReveal>
              </div>
            )}

            {/* Réservations */}
            {activeTab === 'reservations' && (
              <div className="content-section">
                <div className="section-card">
                  <div className="section-header">
                    <div>
                      <h2 className="font-heading text-2xl text-[#FAFAF8]">Mes réservations</h2>
                      <p className="text-[#8B8680] mt-1">Gérez vos séjours et réservez en ligne</p>
                    </div>
                    <button
                      className="btn-refresh"
                      onClick={loadReservations}
                      disabled={reservationsLoading}
                    >
                      {reservationsLoading ? <Loader2 size={18} className="animate-spin" /> : 'Actualiser'}
                    </button>
                  </div>

                  {reservationsLoading ? (
                    <div className="empty-state">
                      <Loader2 size={48} className="animate-spin text-[#C9A96E]" />
                      <p>Chargement...</p>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="empty-state">
                      <Bed size={64} className="text-[#8B8680]" />
                      <h3>Aucune réservation</h3>
                      <p>Réservez votre chambre pour commencer</p>
                      <Link href="/reservation-chambre" className="btn-primary-dash mt-4">
                        Réserver
                      </Link>
                    </div>
                  ) : (
                    <div className="reservations-list">
                      {reservations.map((r) => {
                        const status = getStayStatus(r);
                        const countdown = getCountdown(r);
                        const isExpanded = expandedReservationId === r.id;
                        const canCancel = r.status !== 'cancelled' && r.status !== 'completed';
                        const img = r.room_type_image || HOTEL_IMAGES.rooms?.[0]?.src || '/image-website/room2.jpg';
                        return (
                          <div key={r.id} className={`reservation-card ${isExpanded ? 'expanded' : ''}`}>
                            <div className="reservation-card-image" style={{ backgroundImage: `url(${img})` }}>
                              <div className="reservation-card-overlay" />
                              <span className="reservation-type">{r.room_type_name || 'Chambre'}</span>
                              <span className={`reservation-status ${status.color}`}>{status.label}</span>
                            </div>
                            <div className="reservation-card-body">
                              <div className="reservation-meta">
                                {r.check_in_date && (
                                  <p className="flex items-center gap-2 text-sm text-[#B5B1AC]">
                                    <Calendar size={16} />
                                    {new Date(r.check_in_date).toLocaleDateString('fr-FR')}
                                    {r.check_out_date && ` – ${new Date(r.check_out_date).toLocaleDateString('fr-FR')}`}
                                  </p>
                                )}
                                {countdown && <span className="countdown-tag">{countdown.text}</span>}
                                <p className="text-[#FAFAF8] font-medium mt-1">
                                  {r.nights || 1} nuit{r.nights > 1 ? 's' : ''} • {r.adults || 1} adulte{r.adults > 1 ? 's' : ''}
                                  {r.children ? ` • ${r.children} enfant${r.children > 1 ? 's' : ''}` : ''}
                                </p>
                                <p className="text-[#C9A96E] font-heading text-lg mt-1">
                                  {Number(r.total_amount || 0).toFixed(2)} €
                                </p>
                              </div>
                              {isExpanded && (
                                <div className="reservation-details">
                                  {r.special_requests && <p><strong>Demandes spéciales:</strong> {r.special_requests}</p>}
                                  <div className="reservation-actions">
                                    <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Téléchargement PDF bientôt disponible'); }} className="btn-detail">
                                      <Download size={16} /> PDF
                                    </a>
                                    {canCancel && (
                                      <button
                                        className="btn-cancel"
                                        onClick={() => handleCancelReservation(r.id)}
                                        disabled={cancellingId === r.id}
                                      >
                                        {cancellingId === r.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                        Annuler
                                      </button>
                                    )}
                                    <button
                                      className="btn-delete"
                                      onClick={() => handleDeleteReservation(r.id)}
                                      disabled={deleteLoading === r.id}
                                    >
                                      {deleteLoading === r.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              )}
                              <button
                                className="btn-expand"
                                onClick={() => setExpandedReservationId(isExpanded ? null : r.id)}
                              >
                                {isExpanded ? 'Réduire' : 'Modifier / Détails'} <ChevronRight size={18} className={isExpanded ? 'rotate-90' : ''} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat concierge */}
            {activeTab === 'chats' && (
              <div className="content-section">
                <div className="section-card chat-card">
                  <div className="chat-header">
                    <h2 className="font-heading text-2xl text-[#FAFAF8]">Concierge 24/7</h2>
                    <p className="text-[#8B8680]">Échangez avec l&apos;établissement</p>
                  </div>
                  {chatTabLoading ? (
                    <div className="chat-loading"><Loader2 size={40} className="animate-spin text-[#C9A96E]" /></div>
                  ) : chatConversations.length === 0 ? (
                    <div className="empty-state">
                      <MessageCircle size={64} className="text-[#8B8680]" />
                      <h3 className="text-[#FAFAF8] font-heading text-lg mt-2">Chat avec l&apos;établissement</h3>
                      <p className="text-[#8B8680] mt-1 mb-4">Envoyez un message au concierge pour toute demande.</p>
                      <button
                        type="button"
                        onClick={() => loadChatData()}
                        className="px-6 py-3 bg-[#C9A96E] hover:bg-[#A68A5C] text-[#1A1A1A] font-medium rounded-lg transition-colors"
                      >
                        Démarrer la conversation
                      </button>
                    </div>
                  ) : chatSelectedConversation ? (
                    <>
                      <div className="chat-messages">
                        {chatLoadingMessages ? (
                          <div className="chat-loading"><Loader2 size={28} className="animate-spin" /></div>
                        ) : chatMessages.length === 0 ? (
                          <p className="text-[#8B8680] text-center py-8">Aucun message. Envoyez le premier.</p>
                        ) : (
                          chatMessages.map((msg) => {
                            const isOwn = String(msg.sender_id) === String(user?.id);
                            return (
                              <div key={msg.id} className={`chat-msg ${isOwn ? 'own' : 'other'}`}>
                                <div className="chat-bubble">
                                  <p>{msg.message}</p>
                                  <span className="chat-time">
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>
                      <form className="chat-input" onSubmit={handleSendChatMessage}>
                        <input
                          type="text"
                          value={chatNewMessage}
                          onChange={(e) => setChatNewMessage(e.target.value)}
                          placeholder="Votre message..."
                          disabled={chatSending}
                        />
                        <button type="submit" disabled={!chatNewMessage.trim() || chatSending}>
                          {chatSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* Facturation */}
            {activeTab === 'invoices' && (
              <div className="content-section">
                <div className="section-card">
                  <h2 className="font-heading text-2xl text-[#FAFAF8]">Facturation</h2>
                  <p className="text-[#8B8680] mt-1 mb-6">Factures et historique des paiements</p>
                  <div className="empty-state">
                    <CreditCard size={64} className="text-[#8B8680]" />
                    <h3>Bientôt disponible</h3>
                    <p>Consultez et téléchargez vos factures, gérez vos moyens de paiement.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Check-in digital */}
            {activeTab === 'checkin' && (
              <div className="content-section">
                <div className="section-card">
                  <h2 className="font-heading text-2xl text-[#FAFAF8]">Check-in digital</h2>
                  <p className="text-[#8B8680] mt-1 mb-6">Pré-enregistrez-vous en ligne avant votre arrivée</p>
                  <div className="empty-state">
                    <Shield size={64} className="text-[#8B8680]" />
                    <h3>Bientôt disponible</h3>
                    <p>Infos personnelles, signature électronique, heure d&apos;arrivée.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profil */}
            {activeTab === 'profile' && (
              <div className="content-section">
                <div className="section-card">
                  <h2 className="font-heading text-2xl text-[#FAFAF8]">Profil & préférences</h2>
                  <div className="profile-grid">
                    <div className="profile-avatar">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" />
                      ) : (
                        <span>{user?.firstname?.[0]}{user?.lastname?.[0]}</span>
                      )}
                    </div>
                    <div className="profile-fields">
                      <div className="field">
                        <label>Prénom</label>
                        <span>{user?.firstname}</span>
                      </div>
                      <div className="field">
                        <label>Nom</label>
                        <span>{user?.lastname}</span>
                      </div>
                      <div className="field">
                        <label>Email</label>
                        <span>{user?.email}</span>
                      </div>
                      <div className="field">
                        <label>Téléphone</label>
                        <span>{user?.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#8B8680] text-sm mt-4">Modification du profil – bientôt disponible</p>

                  {/* Sécurité - 2FA */}
                  <div className="profile-2fa mt-6 pt-6 border-t border-white/10">
                    <h3 className="font-heading text-lg text-[#FAFAF8] mb-2 flex items-center gap-2">
                      <Shield size={20} className="text-[#C9A96E]" />
                      Sécurité
                    </h3>
                    <p className="text-[#8B8680] text-sm mb-3">Authentification à deux facteurs (2FA) par application (Google Authenticator, Authy, etc.)</p>
                    <Link
                      href="/auth/enable-2fa"
                      className="inline-flex items-center gap-2 rounded-full border border-[#C9A96E]/40 bg-[#C9A96E]/10 px-4 py-2 text-sm font-medium text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-colors"
                    >
                      <Shield size={16} />
                      Activer la 2FA
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer settings={settings} />

      <style jsx>{`
        .dashboard-hotel {
          min-height: 100vh;
          background: #1A1A1A;
          padding-top: 5.5rem;
          position: relative;
        }
        .dashboard-hotel-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(201,169,110,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(107,44,62,0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        .dashboard-hotel-container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.5s ease;
        }
        .dashboard-hotel-container.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        .dashboard-hotel-sidebar {
          background: rgba(26,26,26,0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(201,169,110,0.15);
          border-radius: 1.25rem;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 6rem;
        }
        .sidebar-header {
          text-align: center;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .user-avatar {
          width: 72px;
          height: 72px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #C9A96E, #A68A5C);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A1A1A;
        }
        .user-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .user-info h3 { color: #FAFAF8; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .user-info p { color: #8B8680; font-size: 0.85rem; margin-bottom: 0.5rem; }
        .user-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(201,169,110,0.2);
          color: #C9A96E;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sidebar-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 0.75rem;
          color: rgba(250,250,248,0.7);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #FAFAF8; }
        .nav-item.active {
          background: rgba(201,169,110,0.15);
          color: #C9A96E;
        }
        .nav-item .badge {
          margin-left: auto;
          background: #C9A96E;
          color: #1A1A1A;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .nav-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0.75rem 0; }
        .nav-item.logout { color: #e57373; }
        .nav-item.logout:hover { background: rgba(229,115,115,0.1); }
        .sidebar-footer { padding-top: 1rem; }
        .theme-toggle {
          padding: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: #8B8680;
          cursor: pointer;
          transition: all 0.2s;
        }
        .theme-toggle:hover { color: #C9A96E; border-color: rgba(201,169,110,0.3); }

        .dashboard-hotel-main { min-height: calc(100vh - 12rem); }
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn-express {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.9rem;
          background: transparent;
          border: 1px solid rgba(201,169,110,0.5);
          border-radius: 9999px;
          color: #C9A96E;
          font-weight: 500;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-express:hover { background: rgba(201,169,110,0.1); border-color: #C9A96E; }
        .btn-primary-dash {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.9rem;
          background: #C9A96E;
          border-radius: 9999px;
          color: #1A1A1A;
          font-weight: 600;
          font-size: 0.8rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary-dash:hover { background: #D4BC8E; transform: translateY(-1px); }

        .content-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .hero-immersive { margin-bottom: 0.5rem; }
        .hero-image-wrap {
          position: relative;
          height: 200px;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(26,26,26,0.9) 0%, transparent 50%);
          z-index: 1;
        }
        .hero-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.5rem;
          z-index: 2;
        }
        .hero-tagline { color: #C9A96E; font-size: 0.8rem; margin-bottom: 0.2rem; }
        .countdown-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(201,169,110,0.15);
          border-radius: 0.75rem;
        }
        .countdown-label { color: #8B8680; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .countdown-badge {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(201,169,110,0.2);
          color: #C9A96E;
          border-radius: 9999px;
          font-size: 0.85rem;
        }
        .btn-detail {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #C9A96E;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
        }
        .btn-detail:hover { text-decoration: underline; }

        .overview-compact { display: flex; flex-direction: column; gap: 1.25rem; }
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.1rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.75rem;
          color: #FAFAF8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stat-pill:hover {
          border-color: rgba(201,169,110,0.25);
          background: rgba(201,169,110,0.05);
        }
        .stat-pill svg { color: #C9A96E; flex-shrink: 0; }
        .stat-pill-value { font-weight: 600; }
        .stat-pill-label { color: #8B8680; font-size: 0.75rem; margin-left: 0.25rem; }
        .quick-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .quick-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.5rem;
          color: rgba(250,250,248,0.85);
          font-size: 0.78rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-link:hover {
          border-color: rgba(201,169,110,0.3);
          color: #C9A96E;
          background: rgba(201,169,110,0.05);
        }
        .quick-link svg { opacity: 0.8; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stat-card:hover {
          border-color: rgba(201,169,110,0.3);
          transform: translateY(-2px);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.gold { background: rgba(201,169,110,0.2); color: #C9A96E; }
        .stat-icon.taupe { background: rgba(139,134,128,0.2); color: #8B8680; }
        .stat-icon.burgundy { background: rgba(107,44,62,0.2); color: #6B2C3E; }
        .stat-value { display: block; color: #FAFAF8; font-size: 1.5rem; font-weight: 700; }
        .stat-label { color: #8B8680; font-size: 0.85rem; }

        .section-card {
          padding: 1.5rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 1.25rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .btn-refresh {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: #FAFAF8;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-refresh:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
        .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 1rem;
          color: #FAFAF8;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .action-btn:hover {
          border-color: rgba(201,169,110,0.4);
          background: rgba(201,169,110,0.05);
        }

        .reservations-list { display: flex; flex-direction: column; gap: 1rem; }
        .reservation-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 1rem;
          overflow: hidden;
          transition: all 0.2s;
        }
        .reservation-card.expanded { border-color: rgba(201,169,110,0.3); }
        .reservation-card-image {
          position: relative;
          height: 140px;
          background-size: cover;
          background-position: center;
        }
        .reservation-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(26,26,26,0.9) 0%, transparent 50%);
        }
        .reservation-type {
          position: absolute;
          bottom: 0.75rem;
          left: 1rem;
          color: #FAFAF8;
          font-weight: 600;
        }
        .reservation-status {
          position: absolute;
          top: 0.75rem;
          right: 1rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .reservation-card-body { padding: 1rem; }
        .countdown-tag {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.2rem 0.5rem;
          background: rgba(201,169,110,0.15);
          color: #C9A96E;
          border-radius: 0.375rem;
          font-size: 0.8rem;
        }
        .reservation-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .reservation-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .btn-cancel {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(245,158,11,0.15);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 0.5rem;
          color: #f59e0b;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-cancel:hover:not(:disabled) { background: rgba(245,158,11,0.25); }
        .btn-delete {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 0.5rem;
          color: #ef4444;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-delete:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
        .btn-expand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.5rem 0;
          background: none;
          border: none;
          color: #C9A96E;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-expand:hover { text-decoration: underline; }

        .chat-card { min-height: 420px; display: flex; flex-direction: column; }
        .chat-header { margin-bottom: 1rem; }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
          max-height: 320px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .chat-msg { display: flex; }
        .chat-msg.own { justify-content: flex-end; }
        .chat-bubble {
          max-width: 75%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .chat-msg.own .chat-bubble {
          background: rgba(201,169,110,0.2);
          border-color: rgba(201,169,110,0.3);
        }
        .chat-time { font-size: 0.7rem; color: #8B8680; margin-top: 0.25rem; display: block; }
        .chat-input {
          display: flex;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .chat-input input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          color: #FAFAF8;
          font-size: 0.95rem;
        }
        .chat-input input::placeholder { color: #8B8680; }
        .chat-input button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #C9A96E;
          border: none;
          color: #1A1A1A;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-input button:disabled { opacity: 0.6; cursor: not-allowed; }
        .chat-loading { display: flex; justify-content: center; padding: 3rem; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: #8B8680;
        }
        .empty-state h3 { color: #FAFAF8; margin: 1rem 0 0.5rem; }
        .empty-state p { margin: 0; }

        .profile-grid { display: flex; gap: 2rem; flex-wrap: wrap; }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #C9A96E, #A68A5C);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1A1A1A;
        }
        .profile-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .profile-fields { flex: 1; min-width: 200px; }
        .field {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .field label { color: #8B8680; }
        .field span { color: #FAFAF8; }

        @media (max-width: 1024px) {
          .dashboard-hotel-container { grid-template-columns: 1fr; }
          .dashboard-hotel-sidebar { position: relative; top: 0; }
        }
        @media (max-width: 640px) {
          .main-header { flex-direction: column; }
          .header-actions { width: 100%; }
          .btn-express, .btn-primary-dash { flex: 1; justify-content: center; }
        }
      `}</style>
    </>
  );
}
