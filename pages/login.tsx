// pages/login.tsx
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const router = useRouter()

  /* --------- pré‑remplissage de l’e‑mail --------- */
  const prefill =
    typeof router.query.email === 'string' ? router.query.email : ''
  const checkMail = router.query.checkMail === '1'

  const [email, setEmail]       = useState(prefill)
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Merci de confirmer ton e‑mail avant de te connecter.')
      } else {
        setError('E‑mail ou mot de passe incorrect.')
      }
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <Layout>
      <section className="flex-grow flex items-center justify-center py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur rounded-xl shadow px-10 py-10 w-full max-w-sm space-y-6"
        >
          <h1 className="text-3xl font-extrabold text-pink-600 text-center">
            Se connecter
          </h1>

          {checkMail && (
            <p className="bg-green-100 text-green-700 p-3 rounded text-sm text-center">
              Un e‑mail de confirmation vient d’être envoyé.<br />
              Valide‑le, puis connecte‑toi !
            </p>
          )}

          {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded text-sm text-center">
              {error}
            </p>
          )}

          <label className="block">
            <span className="sr-only">Adresse e‑mail</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input"
              placeholder="Adresse e‑mail"
            />
          </label>

          <label className="block">
            <span className="sr-only">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input"
              placeholder="Mot de passe"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-pink w-full disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-center text-sm">
            Pas encore inscrit ?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </section>
    </Layout>
  )
}
