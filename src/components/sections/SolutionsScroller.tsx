"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "motion/react";

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

// Dummy solution data for initial implementation
// TODO: Replace with Sanity data via section.solutions
const DUMMY_SOLUTIONS = [
  {
    _id: "1",
    title: "Tuinkamer",
    subtitle: "Geniet het hele jaar van uw tuin",
    slug: { current: "tuinkamer" },
    imageUrl:
      "https://images.unsplash.com/photo-1763368230845-150be8503232?q=80&w=1964&auto=format&fit=crop",
  },
  {
    _id: "2",
    title: "Veranda",
    subtitle: "Overdekt terras met stijl",
    slug: { current: "veranda" },
    imageUrl:
      "https://images.unsplash.com/photo-1758941853341-4e431b9693b7?q=80&w=1585&auto=format&fit=crop",
  },
  {
    _id: "3",
    title: "Carport",
    subtitle: "Bescherm uw auto met elegantie",
    slug: { current: "carport" },
    imageUrl:
      "https://images.unsplash.com/photo-1762543787011-186cfe6f1019?q=80&w=3540&auto=format&fit=crop",
  },
  {
    _id: "4",
    title: "Terrasoverkapping",
    subtitle: "Verleng uw buitenseizoen",
    slug: { current: "terrasoverkapping" },
    imageUrl:
      "https://images.unsplash.com/photo-1763453010420-d126e3171b1c?q=80&w=3540&auto=format&fit=crop",
  },
  {
    _id: "5",
    title: "Schuur",
    subtitle: "Praktische opbergruimte",
    slug: { current: "schuur" },
    imageUrl:
      "https://images.unsplash.com/photo-1763415364262-1ec086926326?q=80&w=1587&auto=format&fit=crop",
  },
  {
    _id: "6",
    title: "Poolhouse",
    subtitle: "Luxe bij het zwembad",
    slug: { current: "poolhouse" },
    imageUrl:
      "https://images.unsplash.com/photo-1730451306804-f7d3b0a3c4d5?q=80&w=2360&auto=format&fit=crop",
  },
  {
    _id: "7",
    title: "Tuinhuis",
    subtitle: "Uw eigen plek in de tuin",
    slug: { current: "tuinhuis" },
    imageUrl:
      "https://images.unsplash.com/photo-1738165170747-ecc6e3a4d97c?q=80&w=3538&auto=format&fit=crop",
  },
  {
    _id: "8",
    title: "Pergola",
    subtitle: "Sfeervolle schaduw",
    slug: { current: "pergola" },
    imageUrl:
      "https://images.unsplash.com/photo-1760292343776-e8e35bb469c6?q=80&w=1945&auto=format&fit=crop",
  },
  {
    _id: "9",
    title: "Overkapping",
    subtitle: "Beschut genieten",
    slug: { current: "overkapping" },
    imageUrl:
      "https://images.unsplash.com/photo-1758032538352-84357479d496?q=80&w=1587&auto=format&fit=crop",
  },
  {
    _id: "10",
    title: "Garage",
    subtitle: "Veilige stalling",
    slug: { current: "garage" },
    imageUrl:
      "https://images.unsplash.com/photo-1758213755328-c4b3912bf5cb?q=80&w=1935&auto=format&fit=crop",
  },
  {
    _id: "11",
    title: "Atelier",
    subtitle: "Creatieve werkruimte",
    slug: { current: "atelier" },
    imageUrl:
      "https://images.unsplash.com/photo-1680457405591-5b20bbf782dd?q=80&w=3540&auto=format&fit=crop",
  },
];

interface SolutionsScrollerProps {
  section: {
    _type: "solutionsScroller";
    heading?: string;
  };
}

export default function SolutionsScroller({ section }: SolutionsScrollerProps) {
  // TODO: Use section.solutions when Sanity integration is added
  const solutions = DUMMY_SOLUTIONS;

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
    <section ref={sectionRef} className="col-span-full bg-amber-200">
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-6">
        {section.heading && <h2 className="!mb-0">{section.heading}</h2>}

        {solutions.length > VISIBLE_CARDS && (
          <div className="flex gap-2">
            <button
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className="bg-white hover:bg-stone-50 text-stone-900 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Vorige oplossingen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className="bg-white hover:bg-stone-50 text-stone-900 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Volgende oplossingen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scroll container - uses o-grid--bleed for full viewport width with aligned padding */}
      <div
        ref={scrollContainerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="o-grid--bleed flex gap-[calc(var(--u-grid-gap)/2)] overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden bg-orange-300"
      >
        {solutions.map((solution) => (
          <Link
            key={solution._id}
            href={`/oplossingen/${solution.slug.current}`}
            data-card
            className="group flex-shrink-0 w-[80vw] sm:w-[calc((var(--u-site-w)-var(--u-grid-gap))/3)] min-w-[280px] flex flex-col gap-3 bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
              <Image
                src={solution.imageUrl || ""}
                alt={solution.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 px-1">
              <h3 className="!mb-0 text-lg font-medium">{solution.title}</h3>
              {solution.subtitle && (
                <p className="text-sm text-stone-600 !mb-0">
                  {solution.subtitle}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="mt-auto px-1">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-accent-dark)] group-hover:gap-2.5 transition-all">
                Bekijk meer
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
