import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

interface Message {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
}

/* petit set d’emojis rapides */
const EMOJIS = ['😀','😁','😂','😍','👍','🔥','❤️','🎉','🍕','🚀'];

export default function MessagesChat({
  userId,
  peerId,
}: {
  userId: string;
  peerId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState('');
  const [soundOn, setSound]     = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);          // ✅ initialisé à null

  /* ---------- charge le son ---------- */
  useEffect(() => {
    audioRef.current = new Audio('/ding.mp3');
  }, []);

  const scroll = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  /* ---------- fetch + realtime ---------- */
  useEffect(() => {
    if (!userId || !peerId) return;

    const fetchMsg = async () => {
      const { data } = await supabase
        .from('messages')                                      // ✅ sans générique
        .select('id,sender,receiver,content,created_at')
        .or(
          `and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`
        )
        .order('created_at')
        .returns<Message[]>();                                 // ✅ typage ici

      setMessages(data || []);
      scroll();
    };
    fetchMsg();

    const channel = supabase
      .channel(`chat:${userId}:${peerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const m = payload.new as Message;
          if (
            (m.sender === userId && m.receiver === peerId) ||
            (m.sender === peerId && m.receiver === userId)
          ) {
            setMessages(prev => [...prev, m]);
            scroll();
            if (soundOn && m.sender === peerId) {
              audioRef.current?.play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    /* ✅ fonction de nettoyage retourne void */
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, peerId, soundOn]);

  /* ---------- envoyer un message ---------- */
  const send = async () => {
    const txt = text.trim();
    if (!txt) return;
    await supabase.from('messages').insert({
      sender:   userId,
      receiver: peerId,
      content:  txt,
    });
    setText('');
  };

  /* ---------- interface ---------- */
  return (
    <div className="flex flex-col h-full">
      {/* zone messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 space-y-4">
        {messages.map(m => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.sender === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[75%] break-words shadow
                ${m.sender === userId
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 rounded-bl-none'}`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* barre d’entrée */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3 flex items-center gap-2">
        {/* emojis */}
        <div className="flex gap-1">
          {EMOJIS.map(e => (
            <button key={e} className="text-xl" onClick={() => setText(t => t + e)}>
              {e}
            </button>
          ))}
        </div>

        <input
          className="flex-1 rounded-full border px-4 py-2 text-sm"
          placeholder="Écris un message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
        />

        <button onClick={() => setSound(s => !s)} className="text-xl">
          {soundOn ? '🔔' : '🔕'}
        </button>

        <button onClick={send} className="px-4 py-2 rounded-full bg-blue-500 text-white">
          Envoyer
        </button>
      </div>
    </div>
  );
}
