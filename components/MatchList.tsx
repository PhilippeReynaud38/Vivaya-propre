import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export default function MatchList({ userId }: { userId: string }) {
  const [matches, setMatches]   = useState<Profile[]>([]);
  const [unreadMap, setUnread]  = useState<Record<string, boolean>>({});

  /* ------ obtient matches + non-lus ------ */
  const fetchMatches = async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender,receiver,seen')
      .or(`sender.eq.${userId},receiver.eq.${userId}`);

    if (!msgs) { setMatches([]); setUnread({}); return; }

    const peerIds = Array.from(
      new Set(
        msgs
          .flatMap(m => [m.sender, m.receiver])
          .filter((id): id is string => Boolean(id) && id !== userId)
      )
    );
    if (peerIds.length === 0) { setMatches([]); setUnread({}); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,username,avatar_url')
      .in('id', peerIds)
      .returns<Profile[]>();

    setMatches(profiles || []);

    const unread: Record<string, boolean> = {};
    msgs.forEach(m => {
      if (m.receiver === userId && m.seen !== true) unread[m.sender] = true;
    });
    setUnread(unread);
  };

  /* ------ effet + realtime ------ */

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        fetchMatches
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };   // ← retourne void
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (matches.length === 0)
    return <p className="p-4 text-gray-500">Aucun match pour le moment…</p>;

  return (
    <ul className="space-y-2">
      {matches.map(p => (
        <li key={p.id}>
          <Link
            href={`/chat/${p.id}`}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
          >
            <Image
              src={p.avatar_url ?? '/default-avatar.png'}
              alt={p.username ?? 'Utilisateur'}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
            <span className="font-medium">{p.username ?? '–'}</span>
            {unreadMap[p.id] && <span className="ml-auto text-red-500">🔴</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
