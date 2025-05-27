
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';

type Message = {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  inserted_at: string;
};

type StatusMap = Record<string, 'online' | 'away' | 'offline'>;

export default function MessagesChat({ userId, peerId }: { userId: string; peerId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [statusMap, setStatusMap] = useState<StatusMap>({});

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`)
      .order('inserted_at', { ascending: true });

    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const fetchStatuses = async () => {
    const { data } = await supabase.from('profiles').select('id, status').in('id', [userId, peerId]);
    if (data) {
      const newStatus: StatusMap = {};
      data.forEach((profile) => {
        newStatus[profile.id] = profile.status || 'offline';
      });
      setStatusMap(newStatus);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchStatuses();

    const msgChannel = supabase
      .channel(`chat:${userId}:${peerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender === userId && m.receiver === peerId) || (m.sender === peerId && m.receiver === userId)) {
          setMessages((prev) => [...prev, m]);
          scrollToBottom();
        }
      })
      .subscribe();

    const statusChannel = supabase
      .channel('status:updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const { id, status } = payload.new;
        if (id === userId || id === peerId) {
          setStatusMap((prev) => ({ ...prev, [id]: status }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [userId, peerId]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender: userId,
      receiver: peerId,
      content: newMsg.trim(),
    });

    if (!error) setNewMsg('');
  };

  const deleteMyMessages = async () => {
    if (!confirm('Supprimer tous vos messages ?')) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .match({ sender: userId, receiver: peerId });

    if (!error) {
      setMessages((prev) => prev.filter((m) => !(m.sender === userId && m.receiver === peerId)));
    }
  };

  const deleteOneMessage = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-80px)] bg-white">
      <div className="text-center text-sm py-2">
        Statut de votre contact :{" "}
        <span className={{
          online: "text-green-600",
          away: "text-yellow-600",
          offline: "text-gray-500",
        }[statusMap[peerId] || 'offline']}>
          {statusMap[peerId] || 'offline'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative px-4 py-2 rounded-xl max-w-[80%] text-sm break-words ${
              m.sender === userId ? 'bg-pink-100 text-right ml-auto' : 'bg-gray-100 text-left mr-auto'
            }`}>
              {m.content}
              {m.sender === userId && (
                <button onClick={() => deleteOneMessage(m.id)}
                        className="absolute -top-2 -right-2 text-xs text-red-400 hover:text-red-700"
                        title="Supprimer ce message">
                  ✖
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex items-center gap-2 shadow z-50">
        <span className="text-xl">😊</span>
        <input type="text" className="flex-1 rounded border px-3 py-2 text-sm sm:text-base"
               placeholder="Écris un message…"
               value={newMsg}
               onChange={(e) => setNewMsg(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
        />
        <button onClick={sendMessage}
                className="px-4 py-2 bg-pink-500 text-white rounded text-sm sm:text-base">
          Envoyer
        </button>
        <button onClick={deleteMyMessages}
                className="text-red-400 hover:text-red-600 text-xl px-2"
                title="Supprimer tous mes messages">
          🗑
        </button>
      </div>
    </div>
  );
}
