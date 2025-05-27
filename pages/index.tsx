// pages/index.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <section className="text-center px-4 pt-20 pb-16">
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-pink-600">
        Bienvenue sur <span className="text-yellow-400">Vivaya</span> 💖
      </h1>

      <p className="max-w-xl mx-auto text-xl text-neutral-700 mb-12">
        Faites des rencontres <span className="font-semibold">fun, sincères et magiques</span>,
        près de chez vous.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
        <Link href="/signup" className="btn-pink text-lg px-10 py-4">
          S’inscrire
        </Link>
        <Link href="/login" className="btn-yellow text-lg px-10 py-4">
          Se connecter
        </Link>
      </div>
    </section>
  );
}
