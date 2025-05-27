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
          <img
            key={index}
            src={url}
            alt={`Photo ${index + 1}`}
            className="w-24 h-24 object-cover rounded border"
          />
        ))}
      </div>
    </div>
  );
}
