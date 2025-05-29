// components/ChatLayout.tsx
import { ReactNode } from "react";
import Image from "next/image";

type Props = {
  avatarUrl: string;
  username: string;
  children: ReactNode;
  maxWidth?: number;      // largeur max en px (desktop) – défaut 820
  hideHeader?: boolean;   // masque le header si besoin
};

export default function ChatLayout({
  avatarUrl,
  username,
  children,
  maxWidth = 820,
  hideHeader = false,
}: Props) {
  /* ───────── HEADER ───────── */
  const Header = (
    <header
      className="fixed inset-x-0 top-0 z-20 flex items-center justify-between
                 px-4 py-2 border-b shadow-sm bg-white/80 backdrop-blur
                 md:static md:bg-transparent md:shadow-none md:border-none"
    >
      <div className="flex items-center gap-2">
        <Image
          src={avatarUrl}
          alt="avatar"
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="font-medium">{username}</span>
      </div>

      <button
        aria-label="Ouvrir le menu"
        className="px-3 py-1 rounded bg-lime-500 text-white font-semibold"
        onClick={() => console.log("ouvrir sidebar/menu")}
      >
        MENU
      </button>
    </header>
  );

  /* ───────── LAYOUT ───────── */
  return (
    <div
      className="flex flex-col h-screen
                 sm:justify-center sm:items-center
                 sm:bg-gradient-to-r sm:from-[#8ee5e0] sm:via-[#adf0ee] sm:to-white"
    >
      {!hideHeader && Header}

      <main
        className="flex-1 overflow-y-auto md:flex md:justify-center sm:h-[90vh]"
        style={{ paddingTop: hideHeader ? 0 : 56 }}
      >
        <div
className="w-full h-full px-2 sm:px-4 md:px-0
                     sm:max-w-xl sm:rounded-xl sm:shadow-lg sm:ring-1 sm:ring-black/10
                     sm:bg-white sm:overflow-hidden"
          style={{ maxWidth }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
