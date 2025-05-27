/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cnjjibjmaeswdxooogvm.supabase.co'],
  },
    // ← ici on ignore les props inconnues (dont fetchPriority) pour faire taire le warning

};

module.exports = nextConfig;
