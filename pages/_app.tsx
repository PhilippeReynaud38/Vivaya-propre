// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Routes pour lesquelles on ne veut pas afficher le Layout
  const noLayoutRoutes = [
    '/signup',
    '/login',
    '/account/delete', // Ajouter d'autres routes ici si nécessaire
  ];

  const isLayoutDisabled = noLayoutRoutes.includes(router.pathname);

  return isLayoutDisabled ? (
    <Component {...pageProps} />
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
