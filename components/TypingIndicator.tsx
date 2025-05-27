
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function TypingIndicator({ channel }: { channel: string }) {
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const subscription = supabase
      .channel(`typing-${channel}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.typing) {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 2000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel])

  return isTyping ? (
    <div className="text-sm italic text-gray-500">L’utilisateur est en train d’écrire…</div>
  ) : null
}
