// pages/profile.tsx
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [loading, setLoading]   = useState(true);
  const [pseudo, setPseudo]     = useState("");
  const [bio, setBio]           = useState("");
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);

  /* ---------------- FETCH PROFILE ---------------- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("username,bio,avatar_url")
        .eq("id", user.id)
        .single<ProfileRow>();

      if (error && error.code !== "PGRST116") console.error(error.message);

      if (data) {
        setPseudo(data.username ?? "");
        setBio(data.bio ?? "");
        setPreview(data.avatar_url);
      }
      setLoading(false);
    })();
  }, [router]);

  /* ---------------- HANDLERS ---------------- */
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function uploadAvatar(userId: string) {
    if (!file) return preview;
    const ext  = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const avatarUrl = await uploadAvatar(user.id);

      /* ---------- upsert avec id === auth.uid() ---------- */
      const updates = {
        id: user.id,                  // 🔑 clé primordiale pour RLS
        username: pseudo,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      /* on garde l’avatar dans auth.user_metadata */
      if (file) {
        await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      }

      alert("Profil enregistré ✔️");
    } catch (err: any) {
      alert(err.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-gray-500">
        Chargement…
      </div>
    );

  return (
    <section className="flex items-center justify-center min-h-[70vh] px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow space-y-6"
      >
        <h1 className="text-2xl font-extrabold text-center text-pink-600">
          Mon profil
        </h1>

        <div className="flex flex-col items-center gap-3">
          <Image
            src={preview || "/default-avatar.png"}
            alt="Avatar"
            width={120}
            height={120}
            className="rounded-full ring-4 ring-pink-300 object-cover"
          />
          <input type="file" accept="image/*" onChange={onFileChange} />
        </div>

        <label className="block">
          <span className="font-semibold">Pseudo</span>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="font-semibold">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-pink w-full disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
