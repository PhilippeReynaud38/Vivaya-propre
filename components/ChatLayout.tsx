// components/ChatLayout.tsx
import { ReactNode } from 'react';
import Image         from 'next/image';
import clsx          from 'clsx';      // déjà présent dans Next 13, sinon `npm add clsx`

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
type ChatLayoutProps = {
  avatarUrl : string;
  username  : string;
  children  : ReactNode;

  /** Largeur max (px) du panneau central sur desktop — défaut : 820 px       */
  maxWidth?   : number;

  /** Masquer complètement le header (par ex. pour une page plein écran)      */
  hideHeader? : boolean;

  /** Callback au clic sur le bouton MENU (ouvre sidebar, etc.)               */
  onMenuClick?: () => void;
};

/* -------------------------------------------------------------------------- */
/*  Constantes locales                                                         */
/* -------------------------------------------------------------------------- */
const HEADER_H = 56;           // 3.5 rem : hauteur du header mobile / tablette
const DEBUG   = process.env.NODE_ENV === 'development';  // aide visuelle

/* -------------------------------------------------------------------------- */
/*  Composant                                                                  */
/* -------------------------------------------------------------------------- */
export default function ChatLayout({
  avatarUrl,
  username,
  children,

  maxWidth   = 820,
  hideHeader = false,
  onMenuClick = () => console.log('[ChatLayout] menu click'),
}: ChatLayoutProps) {
  /* ───────── HEADER ───────── */
  const Header = (
    <header
      className="
        fixed inset-x-0 top-0 z-20 flex items-center justify-between
        border-b bg-white/80 px-4 py-2 shadow-sm backdrop-blur
        md:static md:bg-transparent md:shadow-none md:border-none
      "
    >
      {/* avatar + pseudo --------------------------------------------------- */}
      <div className="flex items-center gap-2">
        <Image
          src={avatarUrl || '/placeholder-avatar.png'}
          alt={`Avatar de ${username}`}
          width={32}
          height={32}
          className="rounded-full object-cover"
          priority
        />
        <span className="font-medium text-neutral-900">{username}</span>
      </div>

      {/* bouton menu ------------------------------------------------------- */}
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={onMenuClick}
        className="
          rounded bg-lime-600 px-3 py-1 text-sm font-semibold text-white
          transition hover:bg-lime-700 active:scale-95
        "
      >
        MENU
      </button>
    </header>
  );

  /* ───────── LAYOUT ───────── */
  return (
    <div
      className="
        flex h-screen flex-col
        sm:items-center sm:justify-center
        sm:bg-gradient-to-r sm:from-[#8ee5e0] sm:via-[#adf0ee] sm:to-white
      "
    >
      {!hideHeader && Header}

      <main
        className={clsx(
          'flex-1 overflow-y-auto md:flex md:justify-center',
         // DEBUG && 'border-4 border-dashed border-amber-500' /* c'est pour le mod debug avec contour en pointillés ( actuellement désactivé )
        )}
        /* on décale le contenu de la hauteur du header côté mobile           */
        style={{ paddingTop: hideHeader ? 0 : HEADER_H }}
      >
        <div
          /* conteneur central (chat)                                         */
          className="
            h-full w-full px-2 sm:h-[90vh] sm:px-4 md:px-0
            sm:max-w-xl sm:overflow-hidden
            sm:rounded-xl sm:bg-white sm:shadow-lg sm:ring-1 sm:ring-black/10
          "
          style={{ maxWidth }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
