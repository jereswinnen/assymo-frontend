"use client";

import { urlFor } from "@/sanity/imageUrl";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

// Animation tokens (matching HeaderClient)
const easing = "easeInOut";
const carouselInterval = 5000;
const carouselTransitionDuration = 0.4;

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
  variant?: "default" | "fullwidth";
}

export default function Slideshow({ images, className = "", variant = "default" }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    if (!images) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (!images) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex || !images) return;
    setCurrentIndex(index);
  };

  // Auto-advance slideshow (resets on manual navigation via currentIndex dependency)
  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, carouselInterval);

    return () => clearInterval(interval);
  }, [images, currentIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-stone-100 ${
        variant === "fullwidth" ? "h-[60vh]" : "h-96"
      }`}>
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: carouselTransitionDuration,
              ease: easing,
            }}
          >
            <Image
              src={urlFor(currentImage).url()}
              alt={currentImage.alt || "Slideshow image"}
              fill
              className={variant === "fullwidth" ? "object-cover" : "object-contain"}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all z-10"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-900 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all z-10"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        <motion.p
          key={currentIndex}
          className="mt-2 text-sm text-stone-600 text-center min-h-[1.25rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: carouselTransitionDuration,
            ease: easing,
          }}
        >
          {currentImage.caption || "\u00A0"}
        </motion.p>
      </AnimatePresence>

      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-current={index === currentIndex ? "true" : undefined}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-stone-900" : "bg-stone-300 hover:bg-stone-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}