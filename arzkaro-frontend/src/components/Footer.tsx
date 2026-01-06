// src/components/Footer.tsx
import React from 'react';
import { motion } from 'framer-motion';

const scrollFadeIn = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true },
};

type FooterProps = {
  onNavigate?: (page: string) => void;
};

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full bg-white pt-16 pb-8 border-t border-black/10">
      {/* @ts-expect-error - Framer Motion ease type incompatibility */}
      <motion.div {...scrollFadeIn} className="max-w-7xl mx-auto px-8 flex flex-col items-center">
        {/* LOGO */}
        <div className="mb-8 sm:mb-10 text-center">
          <img
            src="/logo.png"
            alt="arz logo"
            className="h-16 w-auto sm:h-32 md:h-40 lg:h-44 transition-all"
          />
        </div>

        {/* SEPARATOR */}
        <hr className="w-full max-w-4xl border-t border-black/10 mb-6 hidden sm:block" />

        {/* LEGAL LINKS */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row flex-wrap justify-center sm:justify-between gap-3 sm:gap-4 text-sm sm:text-base text-gray-700 font-semibold mb-4 text-center sm:text-left">
          <p className="text-gray-700">© Arz Pvt. Ltd.</p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center">
            {/* ✅ When clicked, navigate to Terms.tsx */}
            <button
              onClick={() => onNavigate && onNavigate('terms')}
              className="hover:text-black transition-colors"
            >
              Terms & Conditions
            </button>

            <button className="hover:text-black transition-colors">Privacy Policy</button>

            <button className="hover:text-black transition-colors">Contact Us</button>
          </div>
        </div>

        {/* DISCLAIMER */}
        <p className="max-w-4xl text-center text-xs sm:text-sm text-gray-500 mb-6 px-4 leading-relaxed">
          By accessing this page, you confirm that you have read, understood, and agreed to our
          Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines. All rights
          reserved.
        </p>

        {/* SOCIAL ICONS */}
        <div className="flex space-x-6 text-gray-700 justify-center sm:justify-start mt-2">
          {/* Instagram */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 hover:text-black cursor-pointer transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>

          {/* LinkedIn */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 hover:text-black cursor-pointer transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a4 4 0 0 0-4-4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7a4 4 0 0 0 4-4v-5h4V8z" />
          </svg>

          {/* YouTube */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 hover:text-black cursor-pointer transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.94C18.8 4 12 4 12 4s-6.8 0-8.6.48a2.78 2.78 0 0 0-1.94 1.94A29 29 0 0 0 2 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.94C5.2 20 12 20 12 20s6.8 0 8.6-.48a2.78 2.78 0 0 0 1.94-1.94A29 29 0 0 0 22 12a29 29 0 0 0-.46-5.58zM10 15V9l6 3z" />
          </svg>
        </div>

        {/* MOBILE SEPARATOR */}
        <hr className="w-full border-t border-black/10 mt-6 sm:hidden" />
      </motion.div>
    </footer>
  );
}
