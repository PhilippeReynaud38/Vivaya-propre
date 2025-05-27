import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';   // ✅ alias @/   (au lieu de ../lib)
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
      } else {
        // user.email est string | undefined  → on convertit proprement
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, [router]);

  return (
    <section className="mt-10 px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl rounded-xl bg-white/90 p-8 text-center shadow-2xl"
      >
        <h1 className="mb-4 text-3xl font-extrabold text-pink-600">
          🎉 Bienvenue sur votre tableau de bord
        </h1>

        {userEmail && (
          <p className="text-neutral-700">
            Vous êtes connecté en tant que&nbsp;
            <span className="font-semibold text-blue-600">{userEmail}</span>
          </p>
        )}
      </motion.div>
    </section>
  );
}
