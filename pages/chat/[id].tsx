// pages/chat/[id].tsx – header compact, icône MENU, alias @/lib

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';      // ✅ alias @/
import MessagesChat from '@/components/MessagesChat'; // ✅ alias @/

interface PeerProfile {
  username: string;
  avatar_url: string | null;
}

export default function ChatPage() {
  const router   = useRouter();
  const rawId    = Array.isArray(router.query.id)
    ? router.query.id[0]
    : (router.query.id as string) || '';
  const peerId   = rawId.replace(/^['"<]+|['">]+$/g, '');

  const [userId,   setUserId]   = useState<string | null>(null);
  const [peerData, setPeerData] = useState<PeerProfile | null>(null);

  /* -------- récupérer l’utilisateur courant -------- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace('/login');
      else       setUserId(user.id);
    })();
  }, [router]);

  /* -------- récupérer le profil du destinataire -------- */
  useEffect(() => {
    if (!peerId) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', peerId)
        .single();
      if (!error && data) {
        setPeerData({ username: data.username, avatar_url: data.avatar_url });
      }
    })();
  }, [peerId]);

  if (!userId || !peerData) {
    return (
      <div className="flex h-screen items-center justify-center text-neutral-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-gradient-to-b from-[#d9f5e5] to-white">
      {/* --- Header (avatar + nom + menu) --- */}
      <header className="z-10 flex items-center justify-between bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={peerData.avatar_url ?? '/default-avatar.png'}
            alt="Profil"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-chat-accent"
          />
          <span className="text-sm font-semibold">{peerData.username}</span>
        </div>

        <button className="rounded-full bg-chat-accent px-3 py-1 text-sm text-white">
          MENU
        </button>
      </header>

      {/* --- Zone messages --- */}
      <div className="flex-1 overflow-hidden">
        <MessagesChat userId={userId} peerId={peerId} />
      </div>
    </div>
  );
}
