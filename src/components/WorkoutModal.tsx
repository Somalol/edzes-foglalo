import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Clock, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { type WorkoutEvent, type User, type AgeRange, type WorkoutType, WORKOUT_TYPES } from '../types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutEvent | null; // Ha null, akkor új edzést hozunk létre (Admin)
  currentUser: User;
  onBookGuest: (workoutId: string, name: string, ageRange: AgeRange) => void;
  onBookUser: (workoutId: string) => void;
  onCancelBooking: (workoutId: string) => void;
  onSaveWorkout: (workoutData: Partial<WorkoutEvent>) => void;
  onDeleteWorkout?: (workoutId: string) => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  currentUser,
  onBookGuest,
  onBookUser,
  onCancelBooking,
  onSaveWorkout,
  onDeleteWorkout,
}) => {
  // Vendég űrlap állapotok
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState<AgeRange>('26-35');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Admin szerkesztő állapotok
  const [isEditing, setIsEditing] = useState(false);
  const [baseTitle, setBaseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkoutType>('dinamikus');
  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('17:00');
  const [endTimeStr, setEndTimeStr] = useState('18:00');
  const [maxCapacity, setMaxCapacity] = useState(15);

  useEffect(() => {
    setBookingSuccess(false);
    if (workout) {
      setIsEditing(false);
      setBaseTitle(workout.baseTitle);
      setDescription(workout.description);
      setType(workout.type);
      setDateStr(workout.start.toISOString().split('T')[0]);
      setStartTimeStr(workout.start.toTimeString().slice(0, 5));
      setEndTimeStr(workout.end.toTimeString().slice(0, 5));
      setMaxCapacity(workout.maxCapacity);
    } else {
      // Új edzés létrehozása mód
      setIsEditing(true);
      setBaseTitle('');
      setDescription('');
      setType('dinamikus');
      setDateStr(new Date().toISOString().split('T')[0]);
      setStartTimeStr('17:00');
      setEndTimeStr('18:00');
      setMaxCapacity(15);
    }
  }, [workout, isOpen]);

  if (!isOpen) return null;

  const isFull = workout ? workout.participants.length >= workout.maxCapacity : false;
  const isAlreadyBooked = workout
    ? workout.participants.some((p) => p.userId === currentUser.id && !p.isGuest)
    : false;

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workout || !guestName.trim()) return;
    onBookGuest(workout.id, guestName.trim(), guestAge);
    setGuestName('');
    setBookingSuccess(true);
  };

  const handleAdminSave = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${dateStr}T${startTimeStr}:00`);
    const end = new Date(`${dateStr}T${endTimeStr}:00`);

    onSaveWorkout({
      id: workout?.id,
      baseTitle,
      description,
      type,
      start,
      end,
      maxCapacity: Number(maxCapacity),
      color: WORKOUT_TYPES[type].color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-brand-card border border-pastel-sand rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Fejléc */}
        <div 
          className="p-6 text-white flex justify-between items-start"
          style={{ backgroundColor: workout ? workout.color : WORKOUT_TYPES[type].color }}
        >
          <div>
            <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-medium">
              {workout ? WORKOUT_TYPES[workout.type].label : 'Új edzés felvitele'}
            </span>
            <h2 className="text-2xl font-bold mt-2">
              {isEditing ? (workout ? 'Edzés módosítása' : 'Új edzés létrehozása') : workout?.baseTitle}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* 1. ESET: ADMIN SZERKESZTŐ / LÉTREHOZÓ NÉZET */}
          {isEditing && currentUser.role === 'admin' ? (
            <form onSubmit={handleAdminSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Edzés megnevezése</label>
                <input
                  type="text"
                  required
                  value={baseTitle}
                  onChange={(e) => setBaseTitle(e.target.value)}
                  placeholder="pl. Esti Zsírégető Alakformáló"
                  className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Edzés típusa (Szín)</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WorkoutType)}
                    className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {Object.entries(WORKOUT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max. létszám (fő)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dátum</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kezdés</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Befejezés</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rövid leírás / Mit hozz magaddal?</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="pl. Kíméletes, mégis hatékony átmozgatás. Polifoamot biztosítok!"
                  className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-pastel-sand">
                {workout && onDeleteWorkout ? (
                  <button
                    type="button"
                    onClick={() => { onDeleteWorkout(workout.id); onClose(); }}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Edzés törlése
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  {workout && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-pastel-sand text-brand-text text-sm font-medium"
                    >
                      Mégse
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primaryHover transition"
                  >
                    Mentés
                  </button>
                </div>
              </div>
            </form>
          ) : workout ? (
            /* 2. ESET: EDZÉS RÉSZLETEI ÉS JELENTKEZÉS */
            <div className="space-y-6">
              {/* Időpont és Létszám infó */}
              <div className="flex flex-wrap gap-4 text-sm bg-brand-bg p-4 rounded-xl border border-pastel-sand">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  <span>{workout.start.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  <span>
                    {workout.start.toTimeString().slice(0, 5)} - {workout.end.toTimeString().slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full pt-2 border-t border-pastel-sand">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span className="font-medium">
                    Betelt helyek: {workout.participants.length} / {workout.maxCapacity} fő
                  </span>
                  {isFull && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                      Teltház!
                    </span>
                  )}
                </div>
              </div>

              {/* Leírás */}
              {workout.description && (
                <p className="text-brand-muted text-sm leading-relaxed">{workout.description}</p>
              )}

              {bookingSuccess && (
                <div className="p-3 rounded-xl bg-pastel-sage/50 text-brand-text flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                  Sikeresen jelentkeztél az edzésre! Várunk szeretettel!
                </div>
              )}

              {/* SZEREPKÖR SZERINTI MŰVELETEK */}
              {currentUser.role === 'guest' && (
                <div className="border-t border-pastel-sand pt-4">
                  <h3 className="font-semibold text-base mb-1">Jelentkezés vendégként</h3>
                  <p className="text-xs text-brand-muted mb-4">
                    Regisztráció nélkül is foglalhatsz helyet az alábbi adatok megadásával:
                  </p>
                  <form onSubmit={handleGuestSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Teljes neved *</label>
                      <input
                        type="text"
                        required
                        disabled={isFull}
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="pl. Nagy Eszter"
                        className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Korosztályod *</label>
                      <select
                        disabled={isFull}
                        value={guestAge}
                        onChange={(e) => setGuestAge(e.target.value as AgeRange)}
                        className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        <option value="-18">18 év alatt</option>
                        <option value="18-25">18 - 25 év</option>
                        <option value="26-35">26 - 35 év</option>
                        <option value="36-50">36 - 50 év</option>
                        <option value="50+">50+ év</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isFull}
                      className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primaryHover transition disabled:opacity-50"
                    >
                      {isFull ? 'Sajnos minden hely betelt' : 'Hely lefoglalása'}
                    </button>
                  </form>
                </div>
              )}

              {currentUser.role === 'user' && (
                <div className="border-t border-pastel-sand pt-4">
                  <div className="bg-pastel-sand/40 p-3 rounded-xl mb-4 text-xs flex justify-between items-center">
                    <span>Belépve mint: <strong>{currentUser.name}</strong></span>
                    <span className="text-brand-muted">Korosztály: {currentUser.ageRange}</span>
                  </div>
                  {isAlreadyBooked ? (
                    <button
                      onClick={() => onCancelBooking(workout.id)}
                      className="w-full py-2.5 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
                    >
                      Jelentkezés lemondása
                    </button>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => { onBookUser(workout.id); setBookingSuccess(true); }}
                      className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primaryHover transition disabled:opacity-50"
                    >
                      {isFull ? 'Minden hely betelt' : 'Egykattintásos jelentkezés'}
                    </button>
                  )}
                </div>
              )}

              {currentUser.role === 'admin' && (
                <div className="border-t border-pastel-sand pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Eddig jelentkeztek ({workout.participants.length} fő):</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-pastel-sand text-brand-text font-medium hover:opacity-80 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edzés szerkesztése
                    </button>
                  </div>
                  {workout.participants.length === 0 ? (
                    <p className="text-xs text-brand-muted italic">Még senki nem jelentkezett erre az órára.</p>
                  ) : (
                    <ul className="divide-y divide-pastel-sand max-h-40 overflow-y-auto bg-brand-bg rounded-xl border border-pastel-sand px-3">
                      {workout.participants.map((p) => (
                        <li key={p.id} className="py-2 flex justify-between items-center text-sm">
                          <span className="font-medium">{p.name}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-brand-muted">{p.ageRange} év</span>
                            <span className={`px-2 py-0.5 rounded-full ${p.isGuest ? 'bg-pastel-rose/60' : 'bg-pastel-sage/70'}`}>
                              {p.isGuest ? 'Vendég' : 'Tag'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};