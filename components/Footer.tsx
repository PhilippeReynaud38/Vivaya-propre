// components/Footer.tsx

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 text-center text-sm text-gray-600 py-4 border-t">
      <p>
        &copy; 2025 Vivaya. Tous droits réservés.{' '}
        <a
          href="/mentions-legales"
          className="underline hover:text-gray-800"
        >
          Mentions légales
        </a>
      </p>
    </footer>
  );
}
