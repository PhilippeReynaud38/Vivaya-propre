import Image from 'next/image';
interface Props{ url?: string; size?: number; }
export default function Avatar({ url='/default-avatar.png', size=48 }:Props){
  return(
    <Image
      src={url}
      alt="Avatar utilisateur"
      width={size}
      height={size}
      className="rounded-full ring-2 ring-primary object-cover"
    />
  );
}
