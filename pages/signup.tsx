// pages/signup.tsx
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail]      = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe sont différents.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    await supabase.auth.signOut();          // on force la déconnexion créée
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.replace(
        "/login?checkMail=1&email=" + encodeURIComponent(email)
      );
    }
  }

  return (
    <Layout>
      <section className="flex-grow flex items-center justify-center py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur p-10 rounded-xl shadow-xl w-full max-w-md space-y-6"
        >
          <h1 className="text-3xl font-extrabold text-pink-600 text-center">
            Créer un compte
          </h1>

          {error && (
            <p className="bg-red-100 border border-red-300 text-red-800 text-sm rounded p-3 text-center">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-gray-700">Adresse e-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 input-field"
            />
          </label>

          <label className="block">
            <span className="text-gray-700">Mot de passe (≥ 6 car.)</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 input-field"
            />
          </label>

          <label className="block">
            <span className="text-gray-700">Confirme le mot de passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 input-field"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-pink w-full disabled:opacity-50"
          >
            {loading ? "Inscription…" : "S’inscrire"}
          </button>

          <p className="text-center text-sm">
            Déjà inscrit ?{" "}
            {/* ← remplace <a> par <Link> pour satisfaire @next/next/no-html-link-for-pages */}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </section>
    </Layout>
  );
}
