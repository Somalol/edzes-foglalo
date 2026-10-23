import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Send, Calendar, User as UserIcon } from 'lucide-react';
import { type BlogPost, type User } from '../types';

interface BlogSectionProps {
  posts: BlogPost[];
  currentUser: User;
  onAddPost: (title: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  posts,
  currentUser,
  onAddPost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
}) => {
  // Új poszt űrlap állapotai (Adminnak)
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Komment szövegek tárolása poszt ID alapján
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddPost(newTitle.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentTexts[postId];
    if (!text || !text.trim()) return;
    onAddComment(postId, text.trim());
    setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Admin sáv: Új bejegyzés írása */}
      {currentUser.role === 'admin' && (
        <div className="bg-brand-card p-6 rounded-2xl shadow-sm border border-pastel-sand">
          {!isCreating ? (
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-brand-text">Közlemény vagy blogposzt írása</h2>
                <p className="text-xs text-brand-muted">Oszd meg a híreket, edzéstippeket vagy a menetrend változásait!</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primaryHover transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Új poszt írása
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreatePost} className="space-y-4">
              <h3 className="text-lg font-bold text-brand-text border-b border-pastel-sand pb-2">
                Új bejegyzés közzététele
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">Bejegyzés címe</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="pl. Jövő heti ünnepi nyitvatartás és új gumiszalagok!"
                  className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tartalom</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Írd ide a bejegyzés szövegét..."
                  className="w-full px-3 py-2 rounded-xl border border-pastel-sand bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-pastel-sand text-brand-text text-sm font-medium hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primaryHover transition"
                >
                  Közzététel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bejegyzések listája */}
      {posts.length === 0 ? (
        <div className="bg-brand-card p-8 rounded-2xl text-center border border-pastel-sand text-brand-muted">
          Még nincsenek blogbejegyzések.
        </div>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            className="bg-brand-card rounded-2xl shadow-sm border border-pastel-sand overflow-hidden"
          >
            {/* Poszt tartalma */}
            <div className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted mb-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                    {post.createdAt.toLocaleDateString('hu-HU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <h2 className="text-xl font-bold text-brand-text">{post.title}</h2>
                </div>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => onDeletePost(post.id)}
                    title="Bejegyzés törlése"
                    className="p-2 rounded-xl text-brand-muted hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="mt-4 text-brand-text leading-relaxed whitespace-pre-line text-sm md:text-base">
                {post.content}
              </p>
            </div>

            {/* Komment szekció */}
            <div className="bg-brand-bg/70 border-t border-pastel-sand p-6 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-brand-text">
                <MessageSquare className="w-4 h-4 text-brand-primary" />
                Hozzászólások ({post.comments.length})
              </h3>

              {/* Kommentek listázása */}
              {post.comments.length > 0 && (
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-brand-card p-3.5 rounded-xl border border-pastel-sand flex justify-between items-start gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-brand-text flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-brand-primary" />
                            {comment.authorName}
                          </span>
                          <span className="text-[11px] text-brand-muted">
                            {comment.createdAt.toLocaleTimeString('hu-HU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-brand-text">{comment.content}</p>
                      </div>

                      {/* Admin komment törlés gomb */}
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onDeleteComment(post.id, comment.id)}
                          title="Hozzászólás törlése"
                          className="text-brand-muted hover:text-red-500 p-1 rounded-lg transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Új komment írása (Csak belépett tagoknak és adminnak) */}
              {currentUser.role === 'guest' ? (
                <div className="text-xs text-brand-muted bg-pastel-sand/50 p-3 rounded-xl text-center">
                  A hozzászóláshoz kérlek, jelentkezz be! (Válts a fenti sávban „Belépett Tag” nézetre a teszteléshez).
                </div>
              ) : (
                <form
                  onSubmit={(e) => handleCommentSubmit(e, post.id)}
                  className="flex gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={commentTexts[post.id] || ''}
                    onChange={(e) =>
                      setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder={`Hozzászólás írása mint ${currentUser.name}...`}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-pastel-sand bg-brand-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primaryHover transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Küldés
                  </button>
                </form>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
};