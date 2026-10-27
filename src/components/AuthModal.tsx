import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { type User, type AgeRange } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  resetToken?: string | null;
  onClearResetToken?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  resetToken,
  onClearResetToken,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRange>('26-35');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setPassword('');
      setShowPassword(false);
      if (resetToken) {
        setMode('reset');
      } else if (mode === 'reset') {
        setMode('login');
      }
    }
  }, [isOpen, resetToken]);

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setShowPassword(false);
    if (onClearResetToken) onClearResetToken();
    setMode(newMode);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Hiba történt.');
        } else {
          setSuccessMsg(data.message);
        }
        setIsLoading(false);
        return;
      }

      if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Hiba történt.');
        } else {
          if (onClearResetToken) onClearResetToken();
          setMode('login');
          setPassword('');
          setShowPassword(false);
          setSuccessMsg(data.message);
        }
        setIsLoading(false);
        return;
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password, ageRange };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Hiba történt a művelet során.');
        setIsLoading(false);
        return;
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch {
      setError('Nem sikerült kapcsolódni a szerverhez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-brand-card border border-pastel-sand rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Fejléc */}
        <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            {mode === 'login' && <LogIn className="w-5 h-5" />}
            {mode === 'register' && <UserPlus className="w-5 h-5" />}
            {(mode === 'forgot' || mode === 'reset') && <KeyRound className="w-5 h-5" />}
            <h2 className="text-xl font-bold">
              {mode === 'login' && 'Bejelentkezés'}
              {mode === 'register' && 'Fiók létrehozása'}
              {mode === 'forgot' && 'Elfelejtett jelszó'}
              {mode === 'reset' && 'Új jelszó megadása'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Váltófülek (Csak Belépés és Regisztráció módban) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="grid grid-cols-2 bg-brand-bg border-b border-pastel-sand p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 rounded-xl text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-brand-card text-brand-text shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              Belépés
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 rounded-xl text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-brand-card text-brand-text shadow-sm'
                  : 'text-brand-muted hover:text-brand-text'
              }`}
            >
              Regisztráció
            </button>
          </div>
        )}

        {/* Űrlap */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-pastel-sage/50 border border-pastel-sage text-brand-text text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
              {successMsg}
            </div>
          )}

          {mode === 'forgot' && (
            <p className="text-xs text-brand-muted leading-relaxed">
              Add meg a regisztrációkor használt e-mail címedet, és küldünk egy linket, amivel új jelszót állíthatsz be.
            </p>
          )}

          {mode === 'reset' && (
            <p className="text-xs text-brand-muted leading-relaxed">
              Írd be az új jelszavadat az alábbi mezőbe (legalább 4 karakter):
            </p>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium mb-1">Teljes neved *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-brand-muted absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="pl. Szabó Petra"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-medium mb-1">E-mail cím *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelda@email.hu"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium">
                  {mode === 'reset' ? 'Új jelszó *' : 'Jelszó *'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-brand-primary hover:underline font-medium"
                  >
                    Elfelejtetted a jelszavad?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-text transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Korosztályod * <span className="text-brand-muted font-normal">(csak egyszer kell megadnod)</span>
              </label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="-18">18 év alatt (-18)</option>
                <option value="18-25">18 - 25 év</option>
                <option value="26-35">26 - 35 év</option>
                <option value="36-50">36 - 50 év</option>
                <option value="50+">50+ év</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primaryHover transition shadow-sm mt-2 disabled:opacity-50"
          >
            {isLoading
              ? 'Kis türelmet...'
              : mode === 'login'
              ? 'Belépés'
              : mode === 'register'
              ? 'Regisztráció és Belépés'
              : mode === 'forgot'
              ? 'Visszaállító link küldése'
              : 'Új jelszó mentése'}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2 text-xs text-brand-muted hover:text-brand-text font-medium transition"
            >
              ← Vissza a bejelentkezéshez
            </button>
          )}
        </form>
      </div>
    </div>
  );
};