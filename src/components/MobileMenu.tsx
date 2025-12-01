"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  PhoneIcon,
  InstagramIcon,
  FacebookIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Animation tokens (matching HeaderClient)
const easing: [number, number, number, number] = [0.645, 0, 0.045, 1];
const menuDuration = 0.5;
const pageSlideDuration = 0.4;
const translateHorizontal = 8; // Same as desktop submenu
const pageSlideBlur = "2px";

type SubItem = {
  name: string;
  slug: { current: string };
};

type NavLink = {
  title: string;
  slug: string;
  submenuHeading?: string;
  subItems?: SubItem[];
};

type SiteSettings = {
  address?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
};

interface MobileMenuProps {
  links: NavLink[];
  settings?: SiteSettings;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileMenu({
  links,
  settings,
  isOpen,
  onToggle,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState<NavLink | null>(null);
  const [direction, setDirection] = useState(1);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  // Reset to main page when menu closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow exit animation
      const timer = setTimeout(() => {
        setCurrentPage(null);
        setDirection(1);
      }, menuDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    if (isOpen) {
      onToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLinkClick = (link: NavLink) => {
    if (link.subItems && link.subItems.length > 0) {
      setDirection(1);
      setCurrentPage(link);
    } else {
      onToggle();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentPage(null);
  };

  const isMainPage = currentPage === null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 top-0 z-40 bg-white md:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: menuDuration, ease: easing }}
        >
          {/* Content area below header */}
          <div className="h-full pt-[calc(theme(spacing.8)*2+theme(spacing.7))] overflow-y-auto">
            <div className="min-h-full flex flex-col px-6 py-8">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {isMainPage ? (
                  <motion.div
                    key="main"
                    custom={direction}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={{
                      enter: {
                        x: -translateHorizontal,
                        opacity: 0,
                        filter: `blur(${pageSlideBlur})`,
                      },
                      center: {
                        x: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                      },
                      exit: {
                        x: -translateHorizontal,
                        opacity: 0,
                        filter: `blur(${pageSlideBlur})`,
                      },
                    }}
                    transition={{ duration: pageSlideDuration, ease: easing }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Main navigation */}
                    <nav className="flex-1">
                      <ul className="flex flex-col gap-1">
                        {links.map((link) => {
                          const isActive =
                            pathname === `/${link.slug}` ||
                            pathname.startsWith(`/${link.slug}/`);
                          const hasSubItems =
                            link.subItems && link.subItems.length > 0;

                          return (
                            <li key={link.slug}>
                              {hasSubItems ? (
                                <button
                                  onClick={() => handleLinkClick(link)}
                                  className={cn(
                                    "w-full flex items-center justify-between py-3 text-2xl font-medium text-stone-700 transition-colors hover:text-stone-900",
                                    isActive && "text-stone-900"
                                  )}
                                >
                                  <span>{link.title}</span>
                                  <ChevronRightIcon
                                    className="size-6 text-stone-400"
                                    strokeWidth={1.5}
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={`/${link.slug}`}
                                  className={cn(
                                    "block py-3 text-2xl font-medium text-stone-700 transition-colors hover:text-stone-900",
                                    isActive && "text-stone-900"
                                  )}
                                >
                                  {link.title}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </nav>

                    {/* Footer with social links */}
                    {(settings?.phone ||
                      settings?.instagram ||
                      settings?.facebook) && (
                      <div className="mt-auto pt-8 border-t border-stone-200">
                        <ul className="flex gap-6">
                          {settings?.phone && (
                            <li>
                              <a
                                href={`tel:${settings.phone}`}
                                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                              >
                                <PhoneIcon className="size-4" />
                                <span className="sr-only">Bel ons</span>
                              </a>
                            </li>
                          )}
                          {settings?.instagram && (
                            <li>
                              <a
                                href={settings.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                              >
                                <InstagramIcon className="size-4" />
                                <span className="sr-only">Instagram</span>
                              </a>
                            </li>
                          )}
                          {settings?.facebook && (
                            <li>
                              <a
                                href={settings.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                              >
                                <FacebookIcon className="size-4" />
                                <span className="sr-only">Facebook</span>
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentPage.slug}
                    custom={direction}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={{
                      enter: {
                        x: translateHorizontal,
                        opacity: 0,
                        filter: `blur(${pageSlideBlur})`,
                      },
                      center: {
                        x: 0,
                        opacity: 1,
                        filter: "blur(0px)",
                      },
                      exit: {
                        x: translateHorizontal,
                        opacity: 0,
                        filter: `blur(${pageSlideBlur})`,
                      },
                    }}
                    transition={{ duration: pageSlideDuration, ease: easing }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Back button */}
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors mb-6"
                    >
                      <ChevronLeftIcon className="size-4" strokeWidth={2} />
                      <span>Terug</span>
                    </button>

                    {/* Sub-items list */}
                    <nav className="flex-1">
                      <ul className="flex flex-col gap-1">
                        {currentPage.subItems?.map((item) => (
                          <li key={item.slug.current}>
                            <Link
                              href={`/realisaties/${item.slug.current}`}
                              className="block py-3 text-xl font-medium text-stone-700 transition-colors hover:text-stone-900"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hamburger icon component with animation
interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function HamburgerIcon({ isOpen, onClick, className }: HamburgerIconProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center size-10 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors",
        className
      )}
      aria-label={isOpen ? "Sluit menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <div className="relative w-5 h-3.5 flex flex-col justify-between">
        <motion.span
          className="absolute top-0 left-0 w-full h-0.5 bg-stone-700 rounded-full origin-center"
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? 6 : 0,
          }}
          transition={{ duration: 0.3, ease: easing }}
        />
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-0.5 bg-stone-700 rounded-full"
          animate={{
            opacity: isOpen ? 0 : 1,
            scaleX: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: easing }}
        />
        <motion.span
          className="absolute bottom-0 left-0 w-full h-0.5 bg-stone-700 rounded-full origin-center"
          animate={{
            rotate: isOpen ? -45 : 0,
            y: isOpen ? -6 : 0,
          }}
          transition={{ duration: 0.3, ease: easing }}
        />
      </div>
    </button>
  );
}
