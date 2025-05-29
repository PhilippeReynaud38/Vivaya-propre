// components/PhotoGallery.tsx
import Image from "next/image";

interface Props {
  userId: string;
}

const fakePhotos = [
  "https://via.placeholder.com/150",
  "https://via.placeholder.com/150",
  "https://via.placeholder.com/150",
];

export default function PhotoGallery({ userId }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Mes photos</h2>

      <div className="flex gap-2">
        {fakePhotos.map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={`Photo ${index + 1}`}
            width={150}
            height={150}
            className="w-24 h-24 object-cover rounded border"
            priority          /* remplace l’ancien fetchPriority */
          />
        ))}
      </div>
    </div>
  );
}
