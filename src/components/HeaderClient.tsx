"use client";

import Link from "next/link";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { Action } from "./Action";
import {
  Calendar1Icon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
} from "lucide-react";
import { Separator } from "./ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { urlFor } from "@/sanity/imageUrl";

// Animation tokens
const easing = "circInOut";
const translateVertical = -8;
const portalDuration = 0.4;
const subMenuHeightDuration = 0.5;
const subMenuOpacityDuration = 0.4;
const subMenuInnerElementDuration = 0.4;
const carouselInterval = 1900;
const carouselTransitionDuration = 0.4;

type SubItem = {
  name: string;
  slug: { current: string };
  headerImage?: {
    _type: "image";
    asset: { _ref: string; _type: "reference" };
    hotspot?: { x: number; y: number };
    alt?: string;
  };
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

interface HeaderClientProps {
  links: NavLink[];
  settings?: SiteSettings;
  className?: string;
}

export default function HeaderClient({
  links,
  settings,
  className,
}: HeaderClientProps) {
  const [activeLink, setActiveLink] = useState<NavLink | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoveringItem, setIsHoveringItem] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isSubmenuOpen = activeLink !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-cycle through images when not hovering a specific item
  useEffect(() => {
    if (!isSubmenuOpen || isHoveringItem || !activeLink?.subItems?.length) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeLink.subItems!.length);
    }, carouselInterval);

    return () => clearInterval(interval);
  }, [isSubmenuOpen, isHoveringItem, activeLink]);

  const handleLinkHover = (link: NavLink) => {
    if (link.subItems && link.subItems.length > 0) {
      setActiveLink(link);
      setCurrentIndex(0);
      setIsHoveringItem(false);
    }
  };

  const handleMouseLeave = () => {
    setActiveLink(null);
    setCurrentIndex(0);
    setIsHoveringItem(false);
  };

  const handleItemHover = (index: number) => {
    setCurrentIndex(index);
    setIsHoveringItem(true);
  };

  const handleItemsLeave = () => {
    setIsHoveringItem(false);
  };

  const currentImage = activeLink?.subItems?.[currentIndex]?.headerImage;

  return (
    <>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isSubmenuOpen && (
              <motion.div
                className="fixed inset-0 bg-stone-50/80 backdrop-blur-[20px] z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: portalDuration, ease: easing }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
      <motion.header
        className={cn(
          "relative md:flex md:flex-col md:sticky md:top-0 z-50 py-8 bg-white",
          className,
        )}
        initial={false}
        animate={{
          height: isSubmenuOpen ? "auto" : "auto",
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto w-full max-w-site flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-8">
          <Link href="/">
            <Logo className="w-28" />
          </Link>

          <nav className="text-sm bg-ambr-200">
            <ul className="flex gap-6 group/nav">
              {links.map((link) => (
                <li key={link.slug} onMouseEnter={() => handleLinkHover(link)}>
                  <Link
                    href={`/${link.slug}`}
                    className="font-medium transition-opacity duration-200 group-hover/nav:opacity-60 hover:!opacity-100"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Action
            href="/contact"
            icon={<Calendar1Icon />}
            label="Maak een afspraak"
          />
        </div>

        <AnimatePresence>
          {isSubmenuOpen && (
            <motion.div
              className="absolute top-full left-0 right-0 flex gap-8 bg-white shdow-lg overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: subMenuHeightDuration, ease: easing },
                opacity: { duration: subMenuOpacityDuration, ease: easing },
              }}
            >
              <div className="mx-auto w-full max-w-site flex gap-8 py-8">
                <motion.figure
                  className="w-2xs h-96 relative overflow-hidden"
                  initial={{ opacity: 0, y: translateVertical }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: translateVertical }}
                  transition={{
                    duration: subMenuInnerElementDuration,
                    ease: easing,
                  }}
                >
                  <AnimatePresence>
                    {currentImage && (
                      <motion.img
                        key={currentIndex}
                        src={urlFor(currentImage).url()}
                        alt={currentImage.alt || ""}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: carouselTransitionDuration,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.figure>
                <motion.div
                  className="flex flex-col gap-3"
                  initial={{ opacity: 0, y: translateVertical }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: translateVertical }}
                  transition={{
                    duration: subMenuInnerElementDuration,
                    ease: easing,
                  }}
                >
                  {activeLink?.submenuHeading && (
                    <span className="text-xs font-medium text-stone-600">
                      {activeLink.submenuHeading}
                    </span>
                  )}
                  <ul
                    className="flex flex-col gap-1.5 text-2xl font-semibold [&>*>*]:block [&>*>*]:transition-all [&>*>*]:duration-300 [&>*>*]:hover:translate-x-1.5"
                    onMouseLeave={handleItemsLeave}
                  >
                    {activeLink?.subItems?.map((item, index) => (
                      <li
                        key={item.slug.current}
                        onMouseEnter={() => handleItemHover(index)}
                      >
                        <Link href={`/oplossingen/${item.slug.current}`}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div
                  className="ml-auto w-3xs flex flex-col gap-3"
                  initial={{ opacity: 0, y: translateVertical }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: translateVertical }}
                  transition={{
                    duration: subMenuInnerElementDuration,
                    ease: easing,
                  }}
                >
                  <span className="text-xs font-medium text-stone-600">
                    Contacteer
                  </span>
                  <div className="flex flex-col gap-6">
                    <ul className="flex flex-col gap-3 text-base font-medium">
                      {settings?.address && (
                        <li className="whitespace-pre-line">
                          {settings.address}
                        </li>
                      )}
                      {settings?.phone && (
                        <li>
                          <a
                            href={`tel:${settings.phone}`}
                            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                          >
                            <PhoneIcon className="size-4" />
                            <span>{settings.phone}</span>
                          </a>
                        </li>
                      )}
                    </ul>
                    {(settings?.instagram || settings?.facebook) && (
                      <>
                        <Separator />
                        <ul className="flex flex-col gap-3 text-sm font-medium">
                          {settings?.instagram && (
                            <li>
                              <a
                                className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                                href={settings.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <InstagramIcon className="size-4" />
                                Instagram
                              </a>
                            </li>
                          )}
                          {settings?.facebook && (
                            <li>
                              <a
                                className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                                href={settings.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FacebookIcon className="size-4" />
                                Facebook
                              </a>
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
