import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conv, setConv] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    api.getMessages(id).then(r => {
      setMessages(r.messages);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  useEffect(() => {
    // Get conversation info
    api.getConversations().then(r => {
      const c = r.conversations.find(x => x.id === Number(id));
      setConv(c);
    });
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await api.sendMessage(id, text);
      setMessages(m => [...m, r.message]);
      setText('');
    } catch {}
    finally { setSending(false); }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const otherUser = conv?.otherUser;

  return (
    <div className="flex flex-col h-screen bg-base">
      {/* Header */}
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted text-xl">←</button>
        {otherUser && (
          <>
            <div className="w-9 h-9 rounded-full bg-green-t flex items-center justify-center text-lg">
              {({ customer:'🛍️', seller:'🏪', driver:'🛵', admin:'⚙️' })[otherUser.role] || '👤'}
            </div>
            <div>
              <p className="font-semibold text-base text-sm">{otherUser.name}</p>
              <p className="text-xs text-muted capitalize">{otherUser.role}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-nav">
        {messages.map(msg => {
          const isMe = msg.sender.id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-green text-white rounded-br-sm'
                  : 'card rounded-bl-sm text-base'
              }`}>
                <p>{msg.body}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-dim'}`}>
                  {formatTime(msg.createdAt)}
                  {isMe && msg.readAt && ' · Read'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="card rounded-none border-x-0 border-b-0 px-4 py-3 flex gap-2 sticky bottom-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full px-4 py-2 text-sm"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-green px-4 py-2 rounded-full text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
