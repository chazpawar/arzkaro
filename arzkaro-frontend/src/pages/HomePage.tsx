import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function HomePage({
  onNavigate: _onNavigate,
}: {
  onNavigate?: (p: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        v.muted = true;
        v.playsInline = true;
        await v.play();
      } catch {
        // autoplay blocked until interaction; ignore silently
      }
    };

    tryPlay();
    // try again on first user interaction to satisfy some browsers
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('keydown', tryPlay, { once: true });

    return () => {
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };
  const subtleStagger = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, delay: 0.15 },
  };
  const videoPop = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.7, ease: 'easeOut' },
  };

  // Common animation for the new sections
  const scrollFadeIn = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 0.8 },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Mobile header / back button only on small screens. Desktop untouched. */}
      <div className="lg:hidden w-full px-4 pt-4"></div>

      {/* Hero */}
      <main className="flex-1">
        {/* Use 12-grid for precise left/right sizing on large screens */}
        <div className="max-w-7xl mx-auto min-h-[calc(100vh-5rem)] grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* LEFT - text: spans 7/12 on large screens */}
          <motion.section
            {...subtleStagger}
            className="col-span-1 lg:col-span-7 px-6 sm:px-8 lg:px-24 py-8 sm:py-16 flex flex-col justify-center text-center lg:text-left"
          >
            <motion.h1
              {...fadeUp}
              className="font-extrabold text-black leading-[1.05] tracking-tight"
            >
              <span className="block text-[34px] sm:text-[48px] lg:text-[88px]">
                WELCOME TO THE
              </span>
              <span className="block text-[38px] sm:text-[56px] lg:text-[96px] mt-1">
                <span className="text-[#F27B5C]">NEXT GEN</span> TICKETING
              </span>
            </motion.h1>

            <motion.p
              {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.7, delay: 0.12 },
              }}
              className="mt-6 sm:mt-8 max-w-xl text-[15px] sm:text-[17px] text-gray-700 font-medium leading-relaxed mx-auto lg:mx-0"
            >
              Don’t just buy tickets, buy an opportunity to enjoy, meet, and talk before, during and
              after the event.
            </motion.p>
          </motion.section>

          {/* RIGHT - video: spans 5/12 on large screens and sits flush toward right */}
          {/* @ts-expect-error - Framer Motion ease type incompatibility */}
          <motion.section
            {...videoPop}
            className="col-span-1 lg:col-span-5 relative flex items-center justify-center lg:justify-end px-4 lg:px-0 py-6 lg:py-0"
          >
            {/* Container aligned to the right edge of the grid column */}
            <div className="w-full flex justify-center lg:justify-end pr-0 lg:pr-0">
              {/* Responsive vertical video rectangle — mobile: wide, centered, rounded + shadow; desktop: original sizes, flush */}
              <div className="relative w-[92%] sm:w-[300px] lg:w-[360px] h-[260px] sm:h-[320px] lg:h-[580px] overflow-hidden rounded-xl lg:rounded-none shadow-md lg:shadow-none">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/Wait listing.mp4"
                >
                  <source src="/arz 1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* subtle left fade so the vertical video visually blends into the white page */}
                <div
                  aria-hidden
                  className="absolute left-0 top-0 h-full pointer-events-none"
                  style={{
                    width: '6rem',
                    background: 'linear-gradient(to right, rgba(255,255,255,0) 100%)',
                  }}
                />
              </div>
            </div>
          </motion.section>
        </div>

        {/* --- Bottom black strip (moved here before the new sections) --- */}
        <motion.section {...fadeUp} className="w-full bg-black py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H4Z" />
                <path d="M12 4V20" />
                <path d="M8 4V20" />
                <path d="M16 4V20" />
              </svg>
              <p className="text-white font-medium text-xs sm:text-sm md:text-base">
                GET TICKETS TO THE <br /> EVENTS
              </p>
            </div>

            <div>
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 15L16 20L21 15" />
                <path d="M21 15H17C14.79 15 13 13.21 13 11V5C13 3.9 12.1 3 11 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H17" />
              </svg>
              <p className="text-white font-medium text-xs sm:text-sm md:text-base">
                SEE WHO ELSE IS <br /> JOINING
              </p>
            </div>

            <div>
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H8L4 21V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-white font-medium text-xs sm:text-sm md:text-base">
                INTERACT WITH YOUR <br /> COMMUNITY
              </p>
            </div>
          </div>
        </motion.section>

        {/* --- New Section 1: Event Chat Benefits (with Image) --- */}
        <motion.section
          {...scrollFadeIn}
          className="max-w-7xl mx-auto py-16 sm:py-24 px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 items-center min-h-[50vh]"
        >
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-center h-full text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8">You can find out -</h2>
            <ul className="text-lg sm:text-xl space-y-3 sm:space-y-4 font-medium text-gray-800">
              <li>Who's attending</li>
              <li>What the vibe will be</li>
              <li>Whether you will fit in</li>
            </ul>
          </div>

          {/* Right: Image (Event Chat Screenshot) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end mb-8 lg:mb-0">
            {/* The image is now directly placed here */}
            <div className="w-full max-w-md h-auto border border-gray-200 shadow-xl rounded-lg overflow-hidden">
              <img
                src="/homepage.png" // Path to your chat screenshot image
                alt="Event chat screenshot showing conversations"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.section>

        {/* --- New Section 2: Group Trips Benefits (with Image Placeholder) --- */}
        <motion.section
          {...scrollFadeIn}
          className="max-w-7xl mx-auto py-16 sm:py-24 px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 items-center min-h-[50vh]"
        >
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-center h-full text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8">For Group Trips -</h2>
            <ul className="text-lg sm:text-xl space-y-3 sm:space-y-4 font-medium text-gray-800">
              <li>Better Discovery</li>
              <li>Check Reviews</li>
              <li>Verified Co-travellers & Hosts</li>
              <li>Compare with other options</li>
            </ul>
          </div>

          {/* Right: Image (Group Trips Screenshot/UI) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end mb-8 lg:mb-0">
            {/* Placeholder for the group trips screenshot image */}
            <div className="w-full max-w-md h-auto border border-gray-200 shadow-xl rounded-lg overflow-hidden">
              <img
                src="/homepage22.png" // Placeholder: CHANGE THIS to your actual image file (e.g., /trip-image.png)
                alt="Group trip planning interface showing options"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer removed as requested */}
    </div>
  );
}
