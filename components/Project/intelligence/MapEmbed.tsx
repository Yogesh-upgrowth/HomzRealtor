import { MapPin } from "lucide-react";

type Props = {
  title: string;
  address: string;
  lat: number;
  lng: number;
  apiKey: string;
};

const MapEmbed = ({ title, address, lat, lng, apiKey }: Props) => {
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=15`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Location Map – ${title}`}
      </h2>

      <div className="rounded-xl overflow-hidden border border-gray-700">
        <iframe
          src={embedUrl}
          width="100%"
          height="420"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing location of ${title}`}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#CEA44E] hover:text-[#FDF094] transition"
        >
          <MapPin size={15} />
          Open in Google Maps
        </a>
      </div>
    </section>
  );
};

export default MapEmbed;
