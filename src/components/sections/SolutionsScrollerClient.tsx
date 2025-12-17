"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Action } from "../general/Action";

// Animation tokens
const SCROLL_INTERVAL = 4500;
const SCROLL_DURATION = 700;
const IN_VIEW_AMOUNT = 0.1; // Percentage of section visible to trigger auto-advance
const VISIBLE_CARDS = 3; // Number of cards visible at once on desktop

// Easing function matching --ease-circ: cubic-bezier(0.645, 0, 0.045, 1)
function easeCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

export interface SolutionCard {
  _id: string;
  name: string;
  subtitle?: string;
  slug: { current: string };
  imageUrl?: string;
  imageAlt?: string;
}

interface ScrollerNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  className?: string;
}

function ScrollerNavigation({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  className,
}: ScrollerNavigationProps) {
  return (
    <div
      className={cn("flex gap-2 p-1.25 rounded-full bg-stone-200", className)}
    >
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="group cursor-pointer bg-white text-stone-800 rounded-full p-1.25 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:*:translate-0"
        aria-label="Vorige oplossingen"
      >
        <ChevronLeftIcon
          className="size-6 transition-all duration-400 ease-circ group-hover:-translate-x-1"
          strokeWidth={1.5}
        />
      </button>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="group cursor-pointer bg-white text-stone-800 rounded-full p-1.25 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:*:translate-0"
        aria-label="Volgende oplossingen"
      >
        <ChevronRightIcon
          className="size-6 transition-all duration-400 ease-circ group-hover:translate-x-1"
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

interface SolutionsScrollerClientProps {
  heading?: string;
  subtitle?: string;
  solutions: SolutionCard[];
}

export default function SolutionsScrollerClient({
  heading,
  subtitle,
  solutions,
}: SolutionsScrollerClientProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {
    once: false,
    amount: IN_VIEW_AMOUNT,
  });

  const maxIndex = Math.max(0, solutions.length - VISIBLE_CARDS);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  // Scroll the container to show a specific card index at the left edge
  const scrollToCard = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-card]");
    if (cards.length === 0) return;

    const targetCard = cards[Math.min(index, cards.length - 1)] as HTMLElement;
    if (!targetCard) return;

    // Calculate scroll position: card's left edge minus the left padding (bleed)
    const containerStyle = getComputedStyle(container);
    const paddingLeft = parseFloat(containerStyle.paddingLeft);
    const targetScrollLeft = targetCard.offsetLeft - paddingLeft;

    // Animate scroll with ease-circ easing
    const startScrollLeft = container.scrollLeft;
    const distance = targetScrollLeft - startScrollLeft;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);
      const easedProgress = easeCirc(progress);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft =
          startScrollLeft + distance * easedProgress;
      }

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    scrollToCard(newIndex);
  }, [canGoPrevious, currentIndex, scrollToCard]);

  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    scrollToCard(newIndex);
  }, [canGoNext, currentIndex, scrollToCard]);

  // Auto-advance one card at a time (only when in view, stops at end)
  useEffect(() => {
    if (!isInView || isPaused || !canGoNext) return;

    const interval = setInterval(() => {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToCard(newIndex);
    }, SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isInView, isPaused, currentIndex, canGoNext, scrollToCard]);

  if (solutions.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="col-span-full flex flex-col gap-14">
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between">
        <div className="basis-full md:basis-auto flex flex-col gap-2">
          {heading && <h2 className="mb-0!">{heading}</h2>}
          {subtitle && (
            <p className="md:max-w-[60%] text-lg text-stone-600 mb-0!">
              {subtitle}
            </p>
          )}
        </div>

        {solutions.length > VISIBLE_CARDS && (
          <ScrollerNavigation
            onPrevious={goToPrevious}
            onNext={goToNext}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            className="hidden md:flex"
          />
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="o-grid--bleed flex gap-[calc(var(--u-grid-gap)/4)] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {solutions.map((solution) => (
          <motion.div
            key={solution._id}
            onClick={() => router.push(`/realisaties/${solution.slug.current}`)}
            data-card
            initial="idle"
            whileHover="hover"
            className="group relative shrink-0 w-[80vw] sm:w-[calc((var(--u-site-w)-var(--u-grid-gap))/3)] min-w-[280px] flex flex-col gap-4 p-4 pt-0 border-l border-stone-200 hover:border-stone-300 transition-all ease-circ duration-300 cursor-pointer"
          >
            {/* Animated background layer */}
            <motion.div
              className="absolute inset-0 bg-stone-100 -z-10"
              variants={{
                idle: { clipPath: "inset(0 100% 0 0)" },
                hover: { clipPath: "inset(0 0% 0 0)" },
              }}
              transition={{ duration: 0.5, ease: [0.645, 0, 0.045, 1] }}
            />

            {/* Image */}
            <div className="relative max-w-[90%] aspect-5/3 overflow-hidden bg-stone-100">
              {solution.imageUrl && (
                <Image
                  src={solution.imageUrl}
                  alt={solution.imageAlt || solution.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
              <h3 className="mb-0! text-lg font-medium">{solution.name}</h3>
              {solution.subtitle && (
                <p className="text-sm text-stone-600 mb-0!">
                  {solution.subtitle}
                </p>
              )}
            </div>

            {/* Action */}
            <Action
              className="mt-10 opacity-0 translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:opacity-100 group-hover:translate-y-0 group-hover:blur-none"
              href="/contact"
              icon={<InfoIcon />}
              label="Meer informatie"
              variant="secondary"
            />
          </motion.div>
        ))}
      </div>

      {solutions.length > VISIBLE_CARDS && (
        <ScrollerNavigation
          onPrevious={goToPrevious}
          onNext={goToNext}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          className="flex w-fit md:hidden"
        />
      )}
    </section>
  );
}
