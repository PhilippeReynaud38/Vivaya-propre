// components/MessagesChat.tsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* ----------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------*/
export type Message = {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
};
export type Reaction = {
  id: string;
  message_id: number;
  user_id: string;
  emoji: string;
};
export interface MessagesChatProps {
  userId: string;
  peerId: string;
}

/* ----------------------------------------------------------------------
 * Emoji picker
 * --------------------------------------------------------------------*/
const CATS = {
  faces: ["😀", "😁", "😂", "🤣", "😅", "😊", "😎", "😍", "😘", "😜", "🤔", "😢", "😭", "😡", "🥳"],
  gestures: ["👍", "👎", "👌", "👏", "🙌", "🙏", "💪", "🤘", "✌️", "👋"],
  love: ["❤️", "🧡", "💛", "💚", "💙", "💜", "💖", "💕", "💔"],
  fun: ["🎉", "🔥", "✨", "⚡", "💯", "🍕", "🍺", "🤖", "💀", "👻", "🎸", "🎮", "🚀", "🛸", "🎧"],
  misc: ["⭐", "🏆", "⚽", "🎲", "🎵", "📚", "🗺️", "🏖️", "🌈", "🍀"],
} as const;

const CAT_ICON: Record<keyof typeof CATS, string> = {
  faces: "😊",
  gestures: "👍",
  love: "❤️",
  fun: "🎉",
  misc: "✨",
};

/* -------------------------------------------------------------------- */
export default function MessagesChat({ userId, peerId }: MessagesChatProps) {
  /* ---- state & refs -------------------------------------------------*/
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newMsg, setNewMsg]     = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cat, setCat]           = useState<keyof typeof CATS>("faces");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ---- init : charge le son & pref ----------------------------------*/
  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3");
    audioRef.current.volume = 0.4;
    const stored = localStorage.getItem("chatSoundEnabled");
    if (stored !== null) setSoundEnabled(stored === "true");
  }, []);

  /* ---- workaround autoplay (Edge / Firefox) -------------------------*/
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});

      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  /* ---- persiste la préférence son ----------------------------------*/
  useEffect(() => {
    localStorage.setItem("chatSoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

 /* ------------------ fetch initial + realtime -----------------------*/
useEffect(() => {
  /** récupération des messages déjà en base */
  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`
      )
      .order("created_at");

    if (data) {
      setMessages(data as Message[]);
      scrollToBottom();
    }
  };

  /* on déclenche, sans attendre de retour (pas de async directement dans useEffect) */
  fetchMessages().catch(console.error);

  /** abonnement realtime */
  const channel = supabase
    .channel("messages:realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const m = payload.new as Message;
        if (
          (m.sender === userId && m.receiver === peerId) ||
          (m.sender === peerId && m.receiver === userId)
        ) {
          setMessages((prev) => [...prev, m]);

          if (m.sender === peerId && soundEnabled) {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
          }
          setTimeout(scrollToBottom, 50);
        }
      }
    )
    .subscribe();

  /* cleanup : se désabonner */
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId, peerId, soundEnabled]);

  /* ---- envoi message ------------------------------------------------*/
  const sendMessage = async () => {
    const content = newMsg.trim();
    if (!content) return;
    setNewMsg("");
    setPickerOpen(false);
    await supabase.from("messages").insert({ sender: userId, receiver: peerId, content });
    setTimeout(scrollToBottom, 50);
  };

  /* ---- toggle réaction ---------------------------------------------*/
  const toggleReaction = async (msgId: number, emoji: string) => {
    const existing = reactions.find(
      (r) => r.message_id === msgId && r.user_id === userId && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
      setReactions((r) => r.filter((x) => x.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("message_reactions")
        .insert({ message_id: msgId, user_id: userId, emoji })
        .select()
        .single();
      setReactions((r) => [...r, data as Reaction]);
    }
  };

  /* ---- render helper -----------------------------------------------*/
  const renderMessage = (m: Message) => {
    const mine = m.sender === userId;
    const reacts = reactions.filter((r) => r.message_id === m.id);

    return (
      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative px-4 py-2 rounded-xl max-w-[80%] break-words shadow-sm ${
            mine ? "bg-sky-200/90" : "bg-gray-100"
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            toggleReaction(m.id, "❤️");
          }}
        >
          {m.content}
          {reacts.length > 0 && (
            <div className="mt-1 flex gap-1 text-sm">
              {reacts.map((r) => (
                <span key={r.id}>{r.emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---- JSX ---------------------------------------------------------*/
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-28 flex flex-col gap-4 thin-scrollbar">
        {messages.map(renderMessage)}
        <div ref={bottomRef} />
      </div>

      {pickerOpen && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-white border rounded shadow-lg p-3 z-50">
          <div className="flex justify-center gap-2 mb-2">
            {(Object.keys(CATS) as (keyof typeof CATS)[]).map((k) => (
              <button
                key={k}
                aria-label={k}
                className={`px-2 py-1 rounded text-lg ${
                  cat === k ? "bg-primary/20" : "hover:bg-neutral-100"
                }`}
                onClick={() => setCat(k)}
              >
                {CAT_ICON[k]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1 text-xl">
            {CATS[cat].map((e) => (
              <button
                key={e}
                onClick={() => {
                  setNewMsg((t) => t + e);
                  setPickerOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-white border-t p-3 flex items-center gap-2 z-50">
        <button
          aria-label={soundEnabled ? "Désactiver le son" : "Activer le son"}
          className="text-xl"
          onClick={() => setSoundEnabled((v) => !v)}
        >
          {soundEnabled ? "🔔" : "🔕"}
        </button>

        <button
          aria-label="Ouvrir le sélecteur d’émojis"
          className="text-xl"
          onClick={() => setPickerOpen((o) => !o)}
        >
          😊
        </button>

        <input
          data-testid="chat-input"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Écris un message…"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          className="hidden sm:inline-flex bg-primary text-white px-4 py-2 rounded text-sm"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * util clsx
 * --------------------------------------------------------------------*/
function clsx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
