import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Message = {
  id: number
  sender: string
  receiver: string
  content: string
  inserted_at: string
}

export default function MessagesChat({
  userId,
  peerId,
}: {
  userId: string
  peerId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`
      )
      .order('inserted_at', { ascending: true })

    if (data) {
      setMessages(data)
      scrollToBottom()
    }
  }

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`chat:${userId}:${peerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message
          if (
            (m.sender === userId && m.receiver === peerId) ||
            (m.sender === peerId && m.receiver === userId)
          ) {
            setMessages((prev) => [...prev, m])
            scrollToBottom()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, peerId])

  const sendMessage = async () => {
    if (!newMsg.trim()) return

    const { error } = await supabase.from('messages').insert({
      sender: userId,
      receiver: peerId,
      content: newMsg.trim(),
    })

    if (!error) setNewMsg('')
  }

  const deleteMyMessages = async () => {
    if (!confirm('Supprimer tous vos messages ?')) return

    const { error } = await supabase
      .from('messages')
      .delete()
      .match({ sender: userId, receiver: peerId })

    if (!error) {
      setMessages((prev) =>
        prev.filter((m) => !(m.sender === userId && m.receiver === peerId))
      )
    }
  }

  const deleteOneMessage = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return

    const { error } = await supabase.from('messages').delete().eq('id', id)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-80px)] bg-white">
      {/* Bouton supprimer en haut */}
      <div className="flex justify-end px-4 pt-2">
        <button
          onClick={deleteMyMessages}
          className="text-sm text-red-500 hover:text-red-700 underline"
        >
          🗑 Supprimer mes messages
        </button>
      </div>

      {/* Zone de messages avec padding bas */}
      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-2 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender === userId ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`relative px-4 py-2 rounded-lg max-w-[80%] sm:max-w-xs text-sm sm:text-base ${
                m.sender === userId
                  ? 'bg-pink-100 text-right'
                  : 'bg-gray-100 text-left'
              }`}
            >
              {m.content}
              {m.sender === userId && (
                <button
                  onClick={() => deleteOneMessage(m.id)}
                  className="absolute -top-2 -right-2 text-xs text-red-400 hover:text-red-700"
                  title="Supprimer ce message"
                >
                  ✖
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Barre de saisie FIXÉE au-dessus du footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex items-center space-x-2 shadow-md z-50">
        <input
          type="text"
          className="flex-1 rounded border px-3 py-2 text-sm sm:text-base"
          placeholder="Écris un message…"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-pink-500 text-white rounded text-sm sm:text-base"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
