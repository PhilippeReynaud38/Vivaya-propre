// -*- coding: utf-8 -*-
// middleware.ts — Vivaya / Keefon
//
// RÔLE
// - Attacher/rafraîchir la session Supabase côté Edge.
// - Ajouter une protection Basic Auth en production (accès restreint pendant les tests).
// - NE FAIT AUCUNE LECTURE DE TABLE (pas de RLS ici), aucune redirection logique.
// - Toute logique "profil complété ?" se fait dans les pages/layouts applicatifs.
//
// Règles projet : robustesse, simplicité, UTF-8, pas d’usine à gaz, commentaires sobres.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  // Réponse "par défaut"
  const res = NextResponse.next();

  // ---------------------------------------------------------------------------
  // 1) Protection Basic Auth en PRODUCTION uniquement
  // ---------------------------------------------------------------------------
  //
  // Activée seulement si :
  //  - NODE_ENV === 'production'
  //  - SITE_BASIC_AUTH_USER et SITE_BASIC_AUTH_PASS sont définies.
  //
  // Sinon, le site se comporte comme avant (aucun cadenas).
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    const BASIC_AUTH_USER = process.env.SITE_BASIC_AUTH_USER;
    const BASIC_AUTH_PASS = process.env.SITE_BASIC_AUTH_PASS;

    if (BASIC_AUTH_USER && BASIC_AUTH_PASS) {
      const authHeader = req.headers.get('authorization') ?? '';
      let credentialsOK = false;

      if (authHeader.startsWith('Basic ')) {
        const encoded = authHeader.split(' ')[1] ?? '';

        try {
          // atob est dispo dans l'environnement Edge (middleware Next)
          const decoded = atob(encoded);
          const [user, pass] = decoded.split(':');

          if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
            credentialsOK = true;
          }
        } catch {
          credentialsOK = false;
        }
      }

      if (!credentialsOK) {
        // Pas d'auth ou mauvaise auth → on bloque et on demande un login/mot de passe
        return new NextResponse('Authentication required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Keefon - Accès restreint"',
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2) Logique Supabase EXISTANTE (inchangée)
  // ---------------------------------------------------------------------------
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

// Matcher : toutes les routes app, sauf quelques fichiers statiques
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
