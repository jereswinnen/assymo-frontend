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

// Animation tokens
const easing = "circInOut";
const translateVertical = -8;
const portalDuration = 0.4;
const subMenuHeightDuration = 0.5;
const subMenuOpacityDuration = 0.4;
const subMenuInnerElementDuration = 0.4;

type NavLink = {
  title: string;
  slug: string;
};

type Solution = {
  _id: string;
  name: string;
  slug: { current: string };
};

interface HeaderClientProps {
  links: NavLink[];
  solutions: Solution[];
  className?: string;
}

export default function HeaderClient({
  links,
  solutions,
  className,
}: HeaderClientProps) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        onMouseLeave={() => setIsSubmenuOpen(false)}
      >
        <div className="mx-auto w-full max-w-site flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-8">
          <Link href="/">
            <Logo className="w-28" />
          </Link>

          <nav className="text-sm bg-ambr-200">
            <ul className="flex gap-6 group/nav">
              {links.map((link) => {
                const hasSubmenu = link.title === "Exterieur";

                return (
                  <li
                    key={link.slug}
                    onMouseEnter={() => hasSubmenu && setIsSubmenuOpen(true)}
                  >
                    <Link
                      href={`/${link.slug}`}
                      className="font-medium transition-opacity duration-200 group-hover/nav:opacity-60 hover:!opacity-100"
                    >
                      {link.title}
                    </Link>
                  </li>
                );
              })}
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
                  className="w-2xs"
                  initial={{ opacity: 0, y: translateVertical }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: translateVertical }}
                  transition={{
                    duration: subMenuInnerElementDuration,
                    ease: easing,
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                  />
                </motion.figure>
                <motion.div
                  className="flex flex-col gap-3 bg-geen-200"
                  initial={{ opacity: 0, y: translateVertical }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: translateVertical }}
                  transition={{
                    duration: subMenuInnerElementDuration,
                    ease: easing,
                  }}
                >
                  <span className="text-xs font-medium text-stone-600">
                    Ontdek
                  </span>
                  <ul className="flex flex-col gap-1.5 text-2xl font-semibold [&>*>*]:block [&>*>*]:transition-all [&>*>*]:duration-300 [&>*>*]:hover:translate-x-1.5">
                    {[
                      "Trappen",
                      "Badkamer",
                      "Keuken",
                      "Bureau",
                      "Meubilair",
                    ].map((item) => (
                      <li key={item}>
                        <a href="#">{item}</a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div
                  className="ml-auto w-3xs flex flex-col gap-3 bg-inigo-200"
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
                      <li>
                        Eikenlei 159,<br></br>2960 Sint-Job-in-&apos;t-Goor
                      </li>
                      <li>
                        <a
                          href="#"
                          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                        >
                          <PhoneIcon className="size-4" />
                          <span>+32 (0) 3 434 74 98</span>
                        </a>
                      </li>
                    </ul>
                    <Separator />
                    <ul className="flex flex-col gap-3 text-sm font-medium">
                      <li>
                        <a
                          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                          href="#"
                        >
                          <InstagramIcon className="size-4" />
                          Instagram
                        </a>
                      </li>
                      <li>
                        <a
                          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors duration-300"
                          href="#"
                        >
                          <FacebookIcon className="size-4" />
                          Facebook
                        </a>
                      </li>
                    </ul>
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
