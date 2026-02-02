"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const CAROUSEL_INTERVAL = 4000;
const TRANSITION_DURATION = 0.4;
const SWIPE_THRESHOLD = 50;

interface SlideshowImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface SlideshowProps {
  images: SlideshowImage[];
  className?: string;
  variant?: "default" | "fullwidth";
}

export default function Slideshow({
  images: rawImages,
  className = "",
  variant = "default",
}: SlideshowProps) {
  // Filter out images without valid URLs
  const images = rawImages.filter((img) => img.url);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const isLoading = !loadedImages.has(currentIndex);

  const markLoaded = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handlePrevClick = () => {
    goToPrevious();
  };

  const handleNextClick = () => {
    goToNext();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrevious();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    }
  };

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const interval = setInterval(goToNext, CAROUSEL_INTERVAL);
    return () => clearInterval(interval);
  }, [images.length, goToNext, isPaused]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];
  const nextIndex = (currentIndex + 1) % images.length;
  const nextImage = images[nextIndex];
  const hasMultiple = images.length > 1;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`relative overflow-hidden bg-transparent ${variant === "fullwidth" ? "aspect-video" : "aspect-4/3"}`}
      >
        {/* Loading spinner */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100"
            >
              <Spinner className="size-8 text-stone-400" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_DURATION, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt || "Slideshow image"}
              fill
              className="object-cover pointer-events-none select-none"
              sizes="100vw"
              draggable={false}
              onLoad={() => markLoaded(currentIndex)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Preload next image */}
        {hasMultiple && <link rel="preload" as="image" href={nextImage.url} />}

        {hasMultiple && (
          <motion.div
            className="absolute inset-0 z-5 touch-pan-y"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Desktop navigation overlay */}
        {hasMultiple && (
          <div className="absolute bottom-0 left-0 z-10 hidden items-center gap-4 bg-stone-200 px-3 p-2.5 md:flex">
            <span className="text-sm font-medium text-stone-600 tabular-nums">
              {currentIndex + 1}/{images.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevClick}
                className="cursor-pointer text-stone-600 transition-all duration-400 ease-circ hover:-translate-x-0.5 hover:text-stone-800"
                aria-label="Previous image"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <button
                onClick={handleNextClick}
                className="cursor-pointer text-stone-600 transition-all duration-400 ease-circ hover:translate-x-0.5 hover:text-stone-800"
                aria-label="Next image"
              >
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile navigation below image */}
      {hasMultiple && (
        <div className="mt-2 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-1 bg-stone-100 p-1">
            <button
              onClick={handlePrevClick}
              className="cursor-pointer p-2 text-stone-600"
              aria-label="Previous image"
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <button
              onClick={handleNextClick}
              className="cursor-pointer p-2 text-stone-600"
              aria-label="Next image"
            >
              <ArrowRightIcon className="size-4" />
            </button>
          </div>
          <span className="text-sm font-medium text-stone-600 tabular-nums">
            {currentIndex + 1}/{images.length}
          </span>
        </div>
      )}

      {currentImage.caption && (
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            className="mt-2 text-sm text-stone-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_DURATION, ease: "easeInOut" }}
          >
            {currentImage.caption}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  );
}
