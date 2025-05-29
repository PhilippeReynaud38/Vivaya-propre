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
 * Emoji picker data
 * --------------------------------------------------------------------*/
const CATS = {
  faces: [
    "😀","😁","😂","🤣","😅","😊","😎","😍","😘","😜","🤔","😢","😭","😡","🥳",
  ],
  gestures: ["👍","👎","👌","👏","🙌","🙏","💪","🤘","✌️","👋"],
  love: ["❤️","🧡","💛","💚","💙","💜","💖","💕","💔"],
  fun: [
    "🎉","🔥","✨","⚡","💯","🍕","🍺","🤖","💀","👻","🎸","🎮","🚀","🛸","🎧",
  ],
  misc: ["⭐","🏆","⚽","🎲","🎵","📚","🗺️","🏖️","🌈","🍀"],
} as const;

const CAT_ICON: Record<keyof typeof CATS, string> = {
  faces: "😊",
  gestures: "👍",
  love: "❤️",
  fun: "🎉",
  misc: "✨",
};

/* ----------------------------------------------------------------------
 * Petite utilitaire clsx
 * --------------------------------------------------------------------*/
function clsx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ----------------------------------------------------------------------
 * Helper : fallback beep si le mp3 pose problème
 * --------------------------------------------------------------------*/
function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/* ----------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------*/
export default function MessagesChat({ userId, peerId }: MessagesChatProps) {
  /* ------------------ local state & refs ----------------------------*/
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cat, setCat] = useState<keyof typeof CATS>("faces");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dingRef     = useRef<HTMLAudioElement | null>(null);

  /* ------------------ helpers ----------------------------*/
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ------------------ initialisation ---------------------*/
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // sonnerie mp3
    dingRef.current = new Audio("/ding.mp3");
    dingRef.current.preload = "auto";
    dingRef.current.volume = 0.4;

    // pref sound sauvegardée
    const stored = localStorage.getItem("chatSoundEnabled");
    if (stored !== null) setSoundEnabled(stored === "true");
  }, []);

  // ------------------------------------------------------------------
  // 🔑 Edge / Firefox autoplay-policy workaround
  // ------------------------------------------------------------------
  useEffect(() => {
    const unlock = () => {
      audioCtxRef.current?.resume();
      dingRef.current?.play().catch(() => dingRef.current?.pause());
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

  /* ------------------ persistence du réglage son --------------*/
  useEffect(() => {
    localStorage.setItem("chatSoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  /* ------------------ fetch + realtime messages ----------*/
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`
        )
        .order("created_at");
      if (!error && data) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();

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

            // sonnerie uniquement à la réception
            if (m.sender === peerId && soundEnabled) {
              const ding = dingRef.current;
              if (ding) {
                ding.currentTime = 0;
                ding.play().catch(() => {
                  if (audioCtxRef.current) playBeep(audioCtxRef.current);
                });
              } else if (audioCtxRef.current) {
                playBeep(audioCtxRef.current);
              }
            }

            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    // 💡 IMPORTANT : ne pas retourner la Promise, seulement la fonction de cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, peerId, soundEnabled]);

  /* ------------------ send a new message -----------------*/
  const sendMessage = async () => {
    const content = newMsg.trim();
    if (!content) return;
    setNewMsg("");
    setPickerOpen(false);

    await supabase
      .from("messages")
      .insert({ sender: userId, receiver: peerId, content })
      .throwOnError();

    setTimeout(scrollToBottom, 50);
  };

  /* ------------------ toggle reaction --------------------*/
  const toggleReaction = async (msgId: number, emoji: string) => {
    const existing = reactions.find(
      (r) => r.message_id === msgId && r.user_id === userId && r.emoji === emoji
    );

    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id).throwOnError();
      setReactions((r) => r.filter((x) => x.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("message_reactions")
        .insert({ message_id: msgId, user_id: userId, emoji })
        .select()
        .single()
        .throwOnError();
      setReactions((r) => [...r, data as Reaction]);
    }
  };

/* ------------------------------------------------------------------
 * Render helpers
 * ----------------------------------------------------------------*/
const renderMessage = (m: Message) => {
  const mine   = m.sender === userId;
  const reacts = reactions.filter((r) => r.message_id === m.id);

  return (
    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={clsx(
          "relative px-4 py-2 rounded-xl text-sm shadow-sm",
          "max-w-[80%] sm:max-w-[65%] lg:max-w-[45%]",
          mine ? "bg-pink-100" : "bg-white"
        )}
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

  /* ------------------------------------------------------------------
   * JSX
   * ----------------------------------------------------------------*/
  return (
    <div className="flex flex-col h-full relative">
      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-28 space-y-4 thin-scrollbar">
        {messages.map(renderMessage)}
        <div ref={bottomRef} />
      </div>

      {/* Picker d’émojis */}
      {pickerOpen && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-white border rounded shadow-lg p-3 z-50">
          <div className="flex justify-center gap-2 mb-2">
            {(Object.keys(CATS) as (keyof typeof CATS)[]).map((k) => (
              <button
                key={k}
                aria-label={k}
                className={clsx(
                  "px-2 py-1 rounded text-lg",
                  cat === k ? "bg-primary/20" : "hover:bg-neutral-100"
                )}
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

      {/* Barre d’entrée */}

      
<div
  className="
    fixed inset-x-0 bottom-0 bg-white border-t p-3 flex items-center gap-2 shadow z-50
    sm:rounded-b-xl sm:ring-1 sm:ring-black/10
  "
>
        {/* toggle sonnerie */}
        <button
          aria-label={soundEnabled ? "Désactiver le son" : "Activer le son"}
          className="text-xl"
          onClick={() => setSoundEnabled((v) => !v)}
        >
          {soundEnabled ? "🔔" : "🔕"}
        </button>

        {/* toggle picker d’émojis */}
        <button
          aria-label="Ouvrir le sélecteur d’émojis"
          className="text-xl"
          onClick={() => setPickerOpen((o) => !o)}
        >
          😊
        </button>

        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
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
