"use client";
import React, { useState, useContext } from "react";
import Image from "next/image";
import { MapPin, Home, Star } from "lucide-react";
// Import our new types
import { PropertyDetails, ImageGallery } from "@/models/types";
import { FormContext } from "@/context/FormContext";

interface PropertyCardProps {
  data: PropertyDetails;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ data }) => {
  const [selectedImage, setSelectedImage] = useState<ImageGallery>(
    data?.images?.[0]
  );

  const { openForm } = useContext(FormContext);
  // If data is missing or has no images, we can't render the card.
  if (!data || !selectedImage) {
    return <div>Loading project details...</div>;
  }
  return (
    <section
      className="flex flex-col max-w-8xl mx-auto lg:flex-row gap-8 bg-white rounded-2xl overflow-hidden p-2 mt-25">
      {/* Left Section */}
      <div className="lg:w-1/2 w-full">
        <div className="relative w-full h-[450px] rounded-xl overflow-hidden">
          <Image
            src={selectedImage.image}
            alt={data.title}
            fill
            className="object-cover transition-all duration-500"
          />

          {/* Image Thumbnails */}
          <div className="absolute gap-2 mt-4 justify-center bottom-0.5 right-1">
            {/* Map over the new 'images' array */}
            {data.images.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className={`relative w-20 h-16 rounded-md overflow-hidden border-2 ${
                  selectedImage.id === item.id
                    ? "border-white border-2"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={item.image}
                  alt={data.title}
                  fill
                  className="object-cover hover:opacity-80 transition"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section (All data is now static from 'data' prop) */}
      <div className="lg:w-1/2 w-full flex flex-col justify-between">
        <div>
          <h3 className="text-gray-700 text-sm font-semibold mb-1">
            {data.name}
          </h3>
          <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
            {data.title}
          </h2>

          {/* Rating and Meta Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-500" />
              <span className="ml-1 text-sm font-medium text-gray-800">
                {data.rating}
              </span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Home className="w-4 h-4 mr-1" />
              <span>{data.type}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{data.location}</span>
            </div>
          </div>

          {/* Listing ID */}
          <p className="text-xs text-gray-500 mb-2">
            Listing ID: {data.listingId}
          </p>

          {/* Price */}
          <p className="text-2xl font-semibold text-yellow-600 mb-4">
            {data.price}
          </p>

          {/* Description List */}
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            {data.descriptionPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Button */}

        <button
          onClick={openForm}
          className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] hover:bg-yellow-600 text-black font-medium py-2 px-8 rounded-md w-fit hover:cursor-pointer"
        >
          {data.buttonText}
        </button>
      </div>
    </section>
  );
};

export default PropertyCard;
