// pages/auth/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';   // ✅ alias @/

export default function Login() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) setError(error.message);
    else       router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <h1 className="text-center text-2xl font-semibold">Connexion</h1>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          className="w-full rounded border px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
