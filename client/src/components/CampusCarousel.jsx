import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const SLIDES = [
  {
    src:     '/assets/images/Nilkomol.jpg',
    caption: 'Nilkomol — PSTU Campus',
  },
  {
    src:     '/assets/images/Pstu_bus.jpg',
    caption: 'PSTU Transport Service',
  },
];

const INTERVAL_MS = 4000;

export default function CampusCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timerRef              = useRef(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 select-none"
      style={{ aspectRatio: '16/7' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={slide.src}
            alt={slide.caption}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Dark gradient overlay for caption */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {/* Caption */}
          <p className="absolute bottom-3 left-4 text-white text-xs font-medium drop-shadow">
            {slide.caption}
          </p>
        </div>
      ))}

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition"
        aria-label="Previous"
      >
        <FiChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition"
        aria-label="Next"
      >
        <FiChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/75'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
