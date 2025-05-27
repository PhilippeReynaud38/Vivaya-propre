// Voici les fichiers de base pour auth avec Supabase dans Next.js

// Fichier: /pages/auth/signup.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage('❌ ' + error.message);
    else setMessage('✅ Inscription réussie ! Vérifiez votre email.');
  };

  return (
    <div>
      <form onSubmit={handleSignup}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" />
        <button type="submit">S'inscrire</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
