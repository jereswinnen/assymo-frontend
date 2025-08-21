"use client";

import { urlFor } from "@/sanity/imageUrl";
import { useState } from "react";
import Image from "next/image";

interface SlideshowImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number };
  alt: string;
  caption?: string;
}

interface SlideshowProps {
  images: SlideshowImage[];
  className?: string;
}

export default function Slideshow({ images, className = "" }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={urlFor(currentImage).url()}
          alt={currentImage.alt || "Slideshow image"}
          width={800}
          height={600}
          className="w-full h-auto object-cover"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {currentImage.caption && (
        <p className="mt-2 text-sm text-gray-600 text-center">{currentImage.caption}</p>
      )}

      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-gray-900" : "bg-gray-300 hover:bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}