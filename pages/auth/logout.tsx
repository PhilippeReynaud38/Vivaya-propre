import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';   // ✅ chemin corrigé

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
    };
    doLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Déconnexion…</p>
    </div>
  );
}
