import Image from 'next/image';

type Props = {
  url?: string | null;   // URL stockée dans Supabase
  size?: number;         // taille du côté (px)
  className?: string;
};

export default function UserAvatar({ url, size = 32, className = '' }: Props) {
  // Fallback sur notre image par défaut placée dans /public
  const src = url || '/default-avatar.png';

  return (
    <Image
      src={src}
      alt="Avatar"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      priority
    />
  );
}
