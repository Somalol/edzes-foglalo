import { useState, useEffect, useCallback } from 'react';
import { Scheduler } from 'calendarkit-pro';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  BookOpen, 
  LogIn, 
  LogOut,
  Shield
} from 'lucide-react';
import { 
  type WorkoutEvent, 
  type User, 
  type AgeRange, 
  type BlogPost,
  type WorkoutType,
  WORKOUT_TYPES 
} from './types';
import { WorkoutModal } from './components/WorkoutModal';
import { BlogSection } from './components/BlogSection';
import { AuthModal } from './components/AuthModal';

const GUEST_USER: User = {
  id: 'guest',
  name: 'Vendég',
  ageRange: '26-35',
  role: 'guest',
};

const formatTitle = (baseTitle: string, current: number, max: number) =>
  `${baseTitle} (${current}/${max} fő)`;

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : GUEST_USER;
  });

  const [activeTab, setActiveTab] = useState<'calendar' | 'blog'>('calendar');
  const [events, setEvents] = useState<WorkoutEvent[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // MODAL ÁLLAPOTOK
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- ADATOK LEKÉRÉSE A SZERVERRŐL ---
  const fetchWorkouts = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/workouts', { headers });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: WorkoutEvent[] = data.map((w: any) => {
        const wType = (w.type as WorkoutType) || 'dinamikus';
        return {
          ...w,
          start: new Date(w.start),
          end: new Date(w.end),
          color: WORKOUT_TYPES[wType]?.color || '#D88C9A',
          title: formatTitle(w.baseTitle, w.participants.length, w.maxCapacity),
        };
      });
      setEvents(mapped);
    } catch (err) {
      console.error('Hiba az edzések betöltésekor:', err);
    }
  }, [token]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return;
      const data = await res.json();
      const mapped: BlogPost[] = data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        comments: p.comments.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
      }));
      setPosts(mapped);
    } catch (err) {
      console.error('Hiba a blog betöltésekor:', err);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
    fetchPosts();
  }, [fetchWorkouts, fetchPosts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('reset_token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setIsAuthModalOpen(true);
      // Megtisztítjuk az URL-t a böngészősávban
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const selectedWorkout = events.find((e) => e.id === selectedWorkoutId) || null;

  // --- AUTH KEZELÉS ---
  const handleAuthSuccess = (user: User, jwtToken: string) => {
    setCurrentUser(user);
    setToken(jwtToken);
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(GUEST_USER);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // --- EDZÉS ÉS FOGLALÁSI MŰVELETEK ---
  const handleBookGuest = async (workoutId: string, name: string, ageRange: AgeRange) => {
    const res = await fetch(`/api/workouts/${workoutId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ageRange }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Hiba a jelentkezés során.');
      return;
    }
    await fetchWorkouts();
  };

  const handleBookUser = async (workoutId: string) => {
    const res = await fetch(`/api/workouts/${workoutId}/book`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Hiba a jelentkezés során.');
      return;
    }
    await fetchWorkouts();
  };

  const handleCancelBooking = async (workoutId: string) => {
    const res = await fetch(`/api/workouts/${workoutId}/book`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await fetchWorkouts();
    }
  };

  const handleSaveWorkout = async (data: Partial<WorkoutEvent>) => {
    if (data.id) {
      await fetch(`/api/workouts/${data.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    }
    await fetchWorkouts();
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await fetch(`/api/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await fetchWorkouts();
  };

  // --- BLOG MŰVELETEK ---
  const handleAddPost = async (title: string, content: string) => {
    await fetch('/api/posts', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, content }),
    });
    await fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await fetchPosts();
  };

  const handleAddComment = async (postId: string, content: string) => {
    await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    await fetchPosts();
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await fetchPosts();
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-8">
      {/* FEJLÉC ÉS MENÜ */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-col lg:flex-row justify-between items-center bg-brand-card p-6 rounded-2xl shadow-sm border border-pastel-sand gap-4">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-bold text-brand-text">Csoportos Edzések</h1>
          <p className="text-brand-muted text-sm mt-1">
            {activeTab === 'calendar'
              ? 'Kattints egy edzésre a naptárban a részletekért és a jelentkezéshez!'
              : 'Friss hírek, közlemények és közösségi beszélgetés.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {currentUser.role === 'admin' && activeTab === 'calendar' && (
            <button
              onClick={() => {
                setSelectedWorkoutId(null);
                setIsWorkoutModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pastel-sage text-brand-text text-sm font-medium hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Új edzés felvitele
            </button>
          )}

          {/* Nézetváltó gombok: Naptár vs. Blog */}
          <div className="flex bg-brand-bg p-1 rounded-xl border border-pastel-sand">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'calendar'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> Órarend
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'blog'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Blog & Hírek
            </button>
          </div>

          {/* Belépés / Felhasználói profil sáv */}
          {currentUser.role === 'guest' ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primaryHover transition shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Belépés / Regisztráció
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-xl border border-pastel-sand">
              <div className="text-xs">
                <span className="text-brand-muted flex items-center gap-1 text-[10px]">
                  {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-brand-primary" />}
                  Bejelentkezve:
                </span>
                <span className="font-semibold text-brand-text">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Kijelentkezés"
                className="p-1.5 rounded-lg text-brand-muted hover:text-red-600 hover:bg-red-50 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* FŐ TARTALOM: NAPTÁR VAGY BLOG */}
      {activeTab === 'calendar' ? (
        <>
          <div className="max-w-6xl mx-auto mb-4 flex flex-wrap gap-4 px-2">
            {Object.entries(WORKOUT_TYPES).map(([key, item]) => (
              <div key={key} className="flex items-center gap-2 text-xs font-medium text-brand-muted">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>

          <main className="max-w-6xl mx-auto bg-brand-card p-4 md:p-6 rounded-2xl shadow-sm border border-pastel-sand h-[750px]">
            <Scheduler
              events={events}
              view="week"
              readOnly={true}
              onEventClick={(event) => {
                setSelectedWorkoutId(String(event.id));
                setIsWorkoutModalOpen(true);
              }}
            />
          </main>
        </>
      ) : (
        <BlogSection
          posts={posts}
          currentUser={currentUser}
          onAddPost={handleAddPost}
          onDeletePost={handleDeletePost}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {/* EDZÉS FOGLALÁSI ÉS SZERKESZTÉSI MODAL */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        workout={selectedWorkout}
        currentUser={currentUser}
        onBookGuest={handleBookGuest}
        onBookUser={handleBookUser}
        onCancelBooking={handleCancelBooking}
        onSaveWorkout={handleSaveWorkout}
        onDeleteWorkout={handleDeleteWorkout}
      />

      {/* BEJELENTKEZÉS ÉS REGISZTRÁCIÓ MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        resetToken={resetToken}
        onClearResetToken={() => setResetToken(null)}
      />
    </div>
  );
}