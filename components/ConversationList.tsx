import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/router";

interface MessagePreview {
  peerId: string;
  lastMessage: string;
  date: string;
  username?: string;
  unread?: boolean;
}

export default function ConversationList() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MessagePreview[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender.eq.${userId},receiver.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error || !messages) return;

      const seenPeers = new Set<string>();
      const previews: MessagePreview[] = [];

      for (const msg of messages) {
        const peerId = msg.sender === userId ? msg.receiver : msg.sender;
        if (!seenPeers.has(peerId)) {
          previews.push({
            peerId,
            lastMessage: msg.content,
            date: new Date(msg.created_at).toLocaleString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
            }),
            unread: msg.receiver === userId && msg.seen === false,
          });
          seenPeers.add(peerId);
        }
      }

      const peerIds = previews.map((c) => c.peerId);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", peerIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = p.username;
      });

      const enriched = previews.map((c) => ({
        ...c,
        username: nameMap[c.peerId] || c.peerId,
      }));

      setConversations(enriched);
    };

    fetchConversations();
  }, [userId]);

  const currentPeerId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;

  const deleteProfileMessages = async (peerId: string) => {
    const confirmed = confirm("Supprimer toutes les conversations avec cet utilisateur ?");
    if (!confirmed || !userId) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .or(`and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`);

    if (!error) {
      setConversations((prev) => prev.filter((c) => c.peerId !== peerId));
      if (currentPeerId === peerId) router.push("/chat");
    }
  };

  return (
    <ul className="space-y-3">
      {conversations.map((conv) => (
        <li key={conv.peerId} className="relative group bg-white rounded-lg shadow px-4 py-3 transition hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/chat/${conv.peerId}`}
            className={`flex-1 cursor-pointer ${
              conv.peerId === currentPeerId ? "bg-yellow-50" : ""
            }`}
          >
            <div className="font-semibold flex items-center gap-2">
              <span className={conv.unread ? "text-blue-800 font-bold" : ""}>
                {conv.username}
              </span>
              {conv.unread && (
                <span className="w-2 h-2 rounded-full bg-blue-500" title="Message non lu" />
              )}
            </div>
            <div className="text-sm text-gray-600 truncate">{conv.lastMessage}</div>
            <div className="text-xs text-gray-400">{conv.date}</div>
          </Link>

          <button
            onClick={() => deleteProfileMessages(conv.peerId)}
            className="text-sm text-red-400 hover:text-red-600 ml-2 sm:ml-4 sm:absolute sm:right-4 sm:top-3"
            title="Supprimer cette conversation"
          >
            ✖
          </button>
        </li>
      ))}
    </ul>
  );
}
