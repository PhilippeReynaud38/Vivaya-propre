import { useRef } from "react";

interface Props {
  userId: string;
}

export default function UploadPhoto({ userId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return alert("Aucun fichier sélectionné.");

    // Simule un upload
    alert(`Photo "${file.name}" téléchargée pour l'utilisateur ${userId}`);
    // Ici, tu pourras connecter Supabase ou autre plus tard
  };

  return (
    <div className="mb-4">
      <label className="block mb-2 font-semibold">Ajouter une photo</label>
      <input type="file" ref={fileInputRef} />
      <button
        onClick={handleUpload}
        className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Télécharger
      </button>
    </div>
  );
}
