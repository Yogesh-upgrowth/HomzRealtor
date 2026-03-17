import { StaticImageData } from "next/image";

export type GalleryImage = {
  id: string | number;
  src: string | StaticImageData;
  alt: string;
};

export type MapData = {
  src: string | StaticImageData;
  alt: string;
};

export interface FeatureSectionProps {
  title: string;
  subtitle: string;
  variant: "gallery" | "map";
  galleryImages?: GalleryImage[];
  mapData?: MapData;
}

export interface PropertyItem {
  id: string;
  name: string;
  title: string;
  rating: number;
  type: string;
  location: string;
  listingId: string;
  price: string;
  descriptionPoints: string[];
  image: string;
  buttonText: string;
}

// A simple type for just the gallery images
export interface ImageGallery {
  id: string;
  image: string;
}

// The main type for our property details
export interface PropertyDetails {
  id: string;
  title: string;
  name: string;
  rating: number;
  type: string;
  location: string;
  listingId: string;
  price: string;
  descriptionPoints: string[];
  buttonText: string;
  images: ImageGallery[];
}
