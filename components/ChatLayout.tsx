// components/ChatLayout.tsx
// -----------------------------------------------------------------------------
// Centre la page « chat », gère le fond + le mini-switch thème ☀️/🌙/🎉
// (ajout : <main className="relative ..."> pour que le footer sticky
//          de MessagesChat reste bien à l’intérieur sur mobile)
// -----------------------------------------------------------------------------

import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

interface Props { children: ReactNode }

/* --------------------------------------------------------------------------- */
/* 🔘  mini-switch thème                                                       */
/* --------------------------------------------------------------------------- */
const ThemeSwitch = () => {
  type Theme = 'light' | 'dark' | 'fun';
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('vivaya_theme') as Theme) || 'light';
  });

  const apply = (t: Theme) => {
    const html = document.documentElement;
    html.classList.remove('dark');
    html.removeAttribute('data-theme');
    if (t === 'dark') html.classList.add('dark');
    if (t === 'fun')  html.setAttribute('data-theme', 'fun');
  };

  useEffect(() => { apply(theme); }, [theme]);

  const next  = theme === 'light' ? 'dark' : theme === 'dark' ? 'fun' : 'light';
  const icon  = theme === 'light' ? '🌙'   : theme === 'dark' ? '🎉' : '☀️';
  const label = `Passer en ${next === 'light' ? 'clair' : next}`;

  return (
    <button
      title={label}
      onClick={() => { setTheme(next); localStorage.setItem('vivaya_theme', next); }}
      className="text-2xl select-none transition-transform hover:rotate-12 active:scale-90"
    >
      {icon}
    </button>
  );
};

/* --------------------------------------------------------------------------- */
/* 📐  layout                                                                  */
/* --------------------------------------------------------------------------- */
export default function ChatLayout({ children }: Props) {
  return (
    <div
      className={clsx(
        'flex min-h-screen justify-center',
        'lg:gap-4',            // place pour la sidebar ≥ lg
        'px-2 lg:px-6',
        'bg-flow'              // dégradé pastel (déclaré dans globals.css)
      )}
    >
      {/* -------- sidebar “conversations” (placeholder) -------- */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-0 h-full rounded-lg bg-white/70 backdrop-blur shadow p-4">
          <p className="text-sm font-semibold text-brand-700 mb-2">Conversations</p>
          <p className="text-xs text-neutral-500">— en chantier —</p>
        </div>
      </aside>

      {/* -------- conteneur principal -------- */}
      +      <div className="flex flex-col h-full w-full max-w-[768px] rounded-lg
+                      shadow-lg bg-white/70 backdrop-blur">

+      {/* -------- barre supérieure -------- */}
+      <header className="sticky top-0 z-30
+                         flex items-center justify-between px-4 py-2
+                         bg-[var(--c-card,#ffffff)] shadow-sm">
          <span className="font-bold text-primary">Vivaya</span>
          <ThemeSwitch />
        </header>

        {/* zone children – relative ➜ footer sticky (mobile) fonctionne */}
        <main className="relative flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
