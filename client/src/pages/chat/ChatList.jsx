import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversations().then(r => setConversations(r.conversations)).finally(() => setLoading(false));
    const t = setInterval(() => api.getConversations().then(r => setConversations(r.conversations)), 5000);
    return () => clearInterval(t);
  }, []);

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function roleIcon(role) {
    return { customer:'🛍️', seller:'🏪', driver:'🛵', admin:'⚙️' }[role] || '👤';
  }

  // Allow customer to contact support (admin)
  async function contactSupport() {
    try {
      const admins = await api.getAdminContact();
      if (!admins.adminId) return alert('No admin available yet.');
      const r = await api.startConversation(admins.adminId, 'support');
      navigate(`/chat/${r.conversation.id}`);
    } catch { alert('Could not start support chat.'); }
  }

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Header */}
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-lg font-bold text-base">Messages</h1>
          {user.role === 'customer' && (
            <button onClick={contactSupport} className="text-xs font-semibold text-green border border-green px-3 py-1 rounded-full">
              Contact Support
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-dim p-8 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-base">No messages yet</p>
          <p className="text-sm text-muted mt-1">
            {user.role === 'customer' ? 'Contact a seller or tap "Contact Support" above' : 'Messages from customers will appear here'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
          {conversations.map(conv => (
            <button key={conv.id} onClick={() => navigate(`/chat/${conv.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-muted active:bg-muted">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-t flex items-center justify-center text-xl">
                  {roleIcon(conv.otherUser.role)}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base truncate">{conv.otherUser.name}</p>
                  <p className="text-xs text-dim flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</p>
                </div>
                <p className="text-xs text-muted capitalize mb-0.5">{conv.otherUser.role}</p>
                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-base' : 'text-muted'}`}>
                  {conv.lastMessage || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
