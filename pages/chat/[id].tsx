// pages/chat/[id].tsx
// -----------------------------------------------------------------------------
// Page conversation 1-to-1
// -----------------------------------------------------------------------------

import { useRouter }    from "next/router";
import { useEffect, useState } from "react";
import Image            from "next/image";
import ChatLayout       from "../../components/ChatLayout";   // chemin depuis /pages/chat
import MessagesChat     from "../../components/MessagesChat";
import { supabase }     from "../../lib/supabaseClient";

export default function ChatPage() {
  const router = useRouter();

  /* ---------- peerId depuis l’URL ---------- */
  const rawId  = Array.isArray(router.query.id) ? router.query.id[0] : (router.query.id as string) || "";
  const peerId = rawId.replace(/^['"<]+|['">]+$/g, "");

  /* ---------- state courant / peer ---------- */
  const [userId,   setUserId]   = useState<string | null>(null);
  const [peerData, setPeerData] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [peerStatus, setPeerStatus] = useState<"online" | "recent" | "offline" | "unknown">("unknown");

  /* ---------- utilisateur courant ---------- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace("/login");
      else       setUserId(user.id);
    })();
  }, [router]);

  /* ---------- peer (profil + statut) ---------- */
  useEffect(() => {
    const fetchPeer = async () => {
      if (!peerId) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, last_seen")
        .eq("id", peerId)
        .single();

      if (error) { console.error("[peer]", error.message); return; }

      if (data) {
        setPeerData({ username: data.username, avatar_url: data.avatar_url });

        const diff = Date.now() - new Date(data.last_seen).getTime();
        const st   = diff < 60_000  ? "online"
                   : diff < 600_000 ? "recent"
                   : "offline";
        setPeerStatus(st);
      }
    };

    fetchPeer();
    const id = setInterval(fetchPeer, 15_000);   // refresh toutes les 15 s
    return () => clearInterval(id);
  }, [peerId]);

  /* ---------- loading ---------- */
  if (!userId || !peerData)
    return <div className="flex items-center justify-center h-screen text-gray-500">Chargement…</div>;

  /* ---------- render ---------- */
  return (
    <ChatLayout
      avatarUrl={peerData.avatar_url || "/default-avatar.png"}
      username={peerData.username}
      hideHeader                           /* on garde le header custom de cette page */
    >
      {/* -------- Wrapper hauteur complète -------- */}
      <div className="flex flex-col h-full">

        {/* -------- Header custom -------- */}
        <header className="flex justify-between items-center px-4 py-2 bg-white shadow z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-300">
                <Image
                  src={peerData.avatar_url || "/default-avatar.png"}
                  alt="Profil"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </div>
              {peerStatus === "online" && (
                <span className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full" />
              )}
            </div>
            <span className="text-sm font-semibold">{peerData.username}</span>
          </div>

          <button
            onClick={() => alert("Menu (placeholder)")}
            className="bg-lime-400 text-black font-bold px-3 py-1 rounded text-sm"
          >
            MENU
          </button>
        </header>

        {/* -------- Zone messages -------- */}
        <div className="flex-1 h-full overflow-hidden">
          <MessagesChat userId={userId} peerId={peerId} />
        </div>
      </div>
    </ChatLayout>
  );
}
