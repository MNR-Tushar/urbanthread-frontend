import { useEffect, useRef, useState } from 'react';
import api from '../api';

function renderReply(content) {
  const linkLabel = /[\u0980-\u09ff]/.test(content) ? 'পণ্যটি দেখুন' : 'View product';
  return content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!part.startsWith('http://') && !part.startsWith('https://')) return part;
    const url = part.replace(/[.,!?;:]+$/, '');
    const ending = part.slice(url.length);
    return <span key={`${index}-${url}`}><a href={url} target="_blank" rel="noreferrer">{linkLabel}</a>{ending}</span>;
  });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'স্বাগতম! UrbanThread-এর পণ্য ও অর্ডার বিষয়ে সাহায্য করতে পারি। সাধারণ প্রশ্নও করতে পারেন—কী জানতে চান?' },
  ]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setMessage('');
    setSending(true);
    try {
      const { data } = await api.post('/chatbot/', { message: text, history });
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'Sorry, chat is temporarily unavailable. Please try again in a moment.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && <section className="chat-panel" aria-label="UrbanThread customer support">
        <header className="chat-header"><span className="chat-avatar" aria-hidden="true">U</span><span><strong>UrbanThread Support</strong><small>We’re here to help</small></span><button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>×</button></header>
        <div className="chat-messages" ref={listRef} aria-live="polite">
          {messages.map((item, index) => <p key={`${index}-${item.role}`} className={`chat-message ${item.role}`}>{renderReply(item.content)}</p>)}
          {sending && <p className="chat-message assistant chat-typing">Typing…</p>}
        </div>
        <form className="chat-form" onSubmit={sendMessage}><input aria-label="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your question…" maxLength={1000} /><button type="submit" disabled={sending || !message.trim()} aria-label="Send message">↑</button></form>
      </section>}
      <button className="chat-launcher" type="button" aria-expanded={open} aria-label={open ? 'Close customer support chat' : 'Open customer support chat'} onClick={() => setOpen((value) => !value)}>
        {open ? <span aria-hidden="true">×</span> : <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /></svg><span>Chat with us</span></>}
      </button>
    </div>
  );
}
