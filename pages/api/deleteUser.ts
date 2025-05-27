// pages/api/deleteUser.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key côté serveur uniquement
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Méthode non autorisée');

  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'ID utilisateur manquant' });

  try {
    // Suppression du compte utilisateur côté Supabase
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
