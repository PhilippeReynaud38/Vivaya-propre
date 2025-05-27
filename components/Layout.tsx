import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

type LayoutProps = { children: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ───────────────── fetch user & listener ───────────────── */
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? null);                               // ← string | null
        const meta = (user.user_metadata as Record<string, any>) || {};
        setAvatarUrl(meta.avatar_url ?? null);
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ───────────────── actions ───────────────── */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* ───────────────── derived flags ───────────────── */
  const imgSrc = avatarUrl ?? '/default-avatar.png';
  const isChatPage = router.pathname.startsWith('/chat');
  const showHeader = !isChatPage && router.pathname !== '/signup';

  /* ───────────────── render ───────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {showHeader && (
        <header className="bg-white shadow-md px-4 sm:px-6 h-[80px] flex items-center justify-between relative z-50">
          {/* Avatar */}
          <Link
            href="/profile"
            className="block w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-pink-500"
          >
            <Image
              src={imgSrc}
              alt="Avatar utilisateur"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </Link>

          {/* Logo centré */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full flex items-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo Vivaya"
                width={160}
                height={70}
                className="object-contain max-h-[64px] sm:max-h-[72px] sm:w-[180px]"
                priority
              />
            </Link>
          </div>

          {/* Menu desktop */}
          <nav className="hidden sm:flex space-x-4 items-center">
            {email ? (
              <>
                <Link href="/" className="text-blue-600 hover:underline">
                  Accueil
                </Link>
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                  Tableau de bord
                </Link>
                <Link
                  href="/account/settings"
                  className="text-sm text-gray-400 hover:text-blue-500"
                >
                  Paramètres
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-pink-500 text-white rounded"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn-pink">
                  S’inscrire
                </Link>
                <Link href="/login" className="btn-yellow">
                  Se connecter
                </Link>
              </>
            )}
          </nav>

          {/* Menu mobile */}
          <div className="sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-3xl text-pink-500 focus:outline-none"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="absolute right-4 top-[80px] bg-white shadow-lg border rounded z-50 w-48 py-2">
                {email ? (
                  <>
                    <Link
                      href="/"
                      className="block px-4 py-2 text-blue-600"
                      onClick={() => setMenuOpen(false)}
                    >
                      Accueil
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-blue-600"
                      onClick={() => setMenuOpen(false)}
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      href="/account/settings"
                      className="block px-4 py-2 text-gray-500 text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-red-500"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 text-pink-500"
                      onClick={() => setMenuOpen(false)}
                    >
                      S’inscrire
                    </Link>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-yellow-500"
                      onClick={() => setMenuOpen(false)}
                    >
                      Se connecter
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Corps principal */}
      <main className={`flex-1 w-full overflow-y-auto ${isChatPage ? '' : 'p-4 sm:p-6'}`}>
        {children}
      </main>

      {!isChatPage && (
        <footer className="bg-gray-100 text-center p-4 mt-auto text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Vivaya. Tous droits réservés.{' '}
          <Link href="/legal" className="underline">
            Mentions légales
          </Link>
        </footer>
      )}
    </div>
  );
}
