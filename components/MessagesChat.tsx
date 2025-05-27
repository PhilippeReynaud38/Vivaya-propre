// components/MessagesChat.tsx – build 23 mai 2025
// -----------------------------------------------------------------------------
//  • Realtime messages (Supabase) + réactions émoji + indicateur de frappe
//  • RLS OK  • upsert() correct  • UI mise à jour immédiate
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/*──────────── Types ───────────*/
type Message  = { id: number; sender: string; receiver: string; content: string; created_at: string };
type Reaction = { id: string; message_id: number; user_id: string; emoji: string };
type Typing   = { sender: string; receiver: string; is_typing: boolean; updated_at: string };
interface Props { userId: string; peerId: string }

export default function MessagesChat({ userId, peerId }: Props) {
  /*──────────── State ───────────*/
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [reactions,  setReactions]  = useState<Reaction[]>([]);
  const [newMsg,     setNewMsg]     = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showUp,     setShowUp]     = useState(false);
  const [showDown,   setShowDown]   = useState(false);

  /*──────────── Refs ───────────*/
  const scrollRef   = useRef<HTMLDivElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  /*──────────── Constantes ───────────*/
  const emojis = ['😄', '❤️', '👍', '😂', '😢', '🔥'];
  const CLEAR_KEY = `vivaya_cleared_${userId}_${peerId}`;

  /*──────────── Local clear (🗑) ───────────*/
  const [clearedAt, setClearedAt] = useState<number>(() => Number(localStorage.getItem(CLEAR_KEY) || 0));
  const isAfterClear = (iso: string) => new Date(iso).getTime() > clearedAt;

  const clearLocal = () => {
    if (!confirm('Masquer tous les messages de cette conversation pour vous ?')) return;
    const now = Date.now();
    localStorage.setItem(CLEAR_KEY, String(now));
    setClearedAt(now);
  };

  /*──────────── Helpers scroll ───────────*/
  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollTop    = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const handleScroll = () => {
    const el = scrollRef.current; if (!el) return;
    const { scrollTop: st, scrollHeight: sh, clientHeight: ch } = el;
    setShowUp(st > 100); setShowDown(st < sh - ch - 100);
  };

  /*──────────── Initial fetch ───────────*/
  useEffect(() => {
    const fetchAll = async () => {
      const { data: msgs } = await supabase
        .from('messages').select('*')
        .or(
          `and(sender.eq.${userId},receiver.eq.${peerId}),` +
          `and(sender.eq.${peerId},receiver.eq.${userId})`
        )
        .order('created_at')
        .throwOnError();

      setMessages((msgs ?? []).filter(m => isAfterClear(m.created_at)));

      const { data: reacts } = await supabase.from('message_reactions').select('*').throwOnError();
      setReactions((reacts ?? []).filter(r => {
        const m = (msgs ?? []).find(x => x.id === r.message_id);
        return m ? isAfterClear(m.created_at) : false;
      }));

      scrollBottom();
      await supabase.from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId).throwOnError();
    };
    if (userId && peerId) fetchAll();
  }, [userId, peerId, clearedAt]);

  /*──────────── Realtime subs ───────────*/
  useEffect(() => {
    if (!userId || !peerId) return;

    /* messages */
    const chatSub = supabase.channel(`chat:${userId}:${peerId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const m = payload.new as Message;
          const relevant = (m.sender === userId && m.receiver === peerId) ||
                           (m.sender === peerId && m.receiver === userId);
          if (relevant && isAfterClear(m.created_at))
            setMessages(prev => [...prev, m]);
        })
      .subscribe();

    /* typing */
    const typingSub = supabase.channel(`typing:${userId}:${peerId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'typing_status' },
        p => {
          const t = p.new as Typing;
          if (t.sender === peerId && t.receiver === userId) setPeerTyping(t.is_typing);
        })
      .subscribe();

    /* réactions — mise à jour incrémentale */
    const reactSub = supabase.channel('reactions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        p => {
          const r = p.new as Reaction;
          setReactions(prev => {
            /* supprime l’ancienne (si même clé), puis ajoute */
            const without = prev.filter(x => !(x.message_id === r.message_id && x.user_id === r.user_id));
            return [...without, r];
          });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(typingSub);
      supabase.removeChannel(reactSub);
    };
  }, [userId, peerId, clearedAt]);

  /*──────────── Handlers ───────────*/
  const updateTyping = (isTyping: boolean) => supabase.from('typing_status').upsert(
    { sender: userId, receiver: peerId, is_typing: isTyping, updated_at: new Date().toISOString() },
    { onConflict: 'sender,receiver' }
  );

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsg(e.target.value);
    updateTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => updateTyping(false), 4000);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    await supabase.from('messages')
      .insert({ sender: userId, receiver: peerId, content: newMsg.trim() })
      .throwOnError();
    setNewMsg('');
    updateTyping(false);
  };

  /*──────────── ⭐  toggleReaction : correct & instantané ───────────*/
/* remplace entièrement cette fonction dans MessagesChat.tsx */
  const toggleReaction = async (msgId: number, emoji: string) => {
  const existing = reactions.find(r => r.message_id === msgId && r.user_id === userId);

  /* ───── 1.  L’utilisateur reclique sur le même emoji ⇒ DELETE ───── */
  if (existing && existing.emoji === emoji) {
    await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', msgId)
      .eq('user_id',    userId)
      .throwOnError();

    setReactions(prev => prev.filter(r => !(r.message_id === msgId && r.user_id === userId)));
    setSelectedId(null);
    return;
  }

  /* ───── 2.  Sinon ⇒ UPSERT / remplacement ───── */
  await supabase
    .from('message_reactions')
    .upsert(
      { message_id: msgId, user_id: userId, emoji },
      { onConflict: 'message_id,user_id' }
    )
    .throwOnError();

  /* optimistic update immédiate */
  setReactions(prev => {
    const others = prev.filter(r => !(r.message_id === msgId && r.user_id === userId));
    return [...others, { id: crypto.randomUUID(), message_id: msgId, user_id: userId, emoji }];
  });

  setSelectedId(null);
};

  /*──────────── Scroll listener once ───────────*/
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    el.addEventListener('scroll', handleScroll); handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  /*──────────── JSX ───────────*/
  return (
    <div className="flex flex-col h-full relative">
      {/*----------- Messages -----------*/}
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-28 pt-2 space-y-4">
        {messages
          .filter(m => isAfterClear(m.created_at))
          .map(m => {
            const mine  = m.sender === userId;
            const reacts = reactions.filter(r => r.message_id === m.id);
            const bubble = `relative px-4 py-2 rounded-xl max-w-[80%] text-sm shadow
                            ${mine ? 'bg-pink-100 ml-auto' : 'bg-white mr-auto'}`;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={bubble} onClick={() => setSelectedId(sel => sel === m.id ? null : m.id)}>
                  <div className="break-words whitespace-pre-wrap">{m.content}</div>

                  {reacts.length > 0 &&
                    <div className="mt-1 flex gap-1 text-sm">{reacts.map(r => <span key={r.id}>{r.emoji}</span>)}</div>}

                  {selectedId === m.id &&
                    <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 border rounded shadow bg-white z-10">
                      {emojis.map(e =>
                        <button key={e} onClick={() => toggleReaction(m.id, e)} className="hover:scale-125 transition">
                          {e}
                        </button>
                      )}
                    </div>}
                </div>
              </div>
            );
        })}
        {peerTyping && <div className="text-sm italic text-neutral-500 px-1">L’autre écrit…</div>}
        <div ref={bottomRef}/>
      </div>

      {/*----------- Emoji picker global -----------*/}
      {showPicker &&
        <div className="absolute bottom-20 left-4 flex gap-2 p-2 border rounded shadow bg-white z-50">
          {emojis.map(e =>
            <button key={e} onClick={() => { setNewMsg(t=>t+e); setShowPicker(false); }}
              className="text-xl hover:scale-125 transition">{e}</button>
          )}
        </div>}

      {/*----------- Barre de saisie -----------*/}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t p-3 flex items-center gap-2 z-50">
        <button onClick={() => setShowPicker(s=>!s)} className="text-xl">😊</button>

        <input
          ref={inputRef}
          value={newMsg}
          onChange={onType}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
          placeholder="Écris un message…"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />

        <button onClick={sendMessage}
          className="hidden sm:inline-flex bg-[var(--c-primary)] text-white px-4 py-2 rounded text-sm">
          Envoyer
        </button>

        <button onClick={clearLocal} className="hidden sm:inline-flex p-2 icon-action" aria-label="Masquer localement">
          🗑
        </button>
      </div>

      {/*----------- Flèches -----------*/}
      {showUp   && <button onClick={scrollTop}    className="absolute -right-2 bottom-40 p-1 opacity-60 hover:opacity-100">▲</button>}
      {showDown && <button onClick={scrollBottom} className="absolute -right-2 bottom-28 p-1 opacity-60 hover:opacity-100">▼</button>}
    </div>
  );
}
