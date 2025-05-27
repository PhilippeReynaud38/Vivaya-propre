import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import dayjs from "dayjs";

interface Message {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
}

interface ChatBoxProps {
  otherUserId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ otherUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const user = useUser();

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender.eq.${user.id},receiver.eq.${otherUserId}),and(sender.eq.${otherUserId},receiver.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("messages").insert({
      sender: user.id,
      receiver: otherUserId,
      content: newMessage,
    });

    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[70%] p-2 rounded-xl text-sm ${
              msg.sender === user?.id
                ? "bg-blue-500 text-white self-end"
                : "bg-gray-200 text-black self-start"
            }`}
          >
            <p>{msg.content}</p>
            <p className="text-[10px] opacity-60 mt-1 text-right">{dayjs(msg.created_at).format("HH:mm")}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-full"
          onClick={sendMessage}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
