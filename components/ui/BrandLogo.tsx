'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: 'h-7 w-7', svg: 'w-4 h-4', text: 'text-base' },
    md: { icon: 'h-8 w-8 sm:h-9 sm:w-9', svg: 'w-4.5 h-4.5 sm:w-5 sm:h-5', text: 'text-base sm:text-lg xl:text-xl' },
    lg: { icon: 'h-10 w-10 sm:h-12 sm:w-12', svg: 'w-6 h-6', text: 'text-xl sm:text-2xl' },
    xl: { icon: 'h-14 w-14 sm:h-16 sm:w-16', svg: 'w-8 h-8', text: 'text-3xl sm:text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      {/* Bespoke Geometric Monogram Icon */}
      <div
        className={`relative flex ${currentSize.icon} items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-700 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 overflow-hidden flex-shrink-0 group-hover:shadow-cyan-400/40 group-hover:scale-105 transition-all`}
      >
        {/* Subtle geometric background grid effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px] opacity-20" />

        {/* Custom Sharp Monogram Insignia */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.svg} text-white relative z-10 drop-shadow-md`}
        >
          {/* Outer Monogram Crest */}
          <path
            d="M5 4.5V13.5C5 17.0899 7.91015 20 11.5 20H12.5C16.0899 20 19 17.0899 19 13.5V4.5M9 4.5V13C9 14.6569 10.3431 16 12 16C13.6569 16 15 14.6569 15 13V4.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Apex Core Energy Gem */}
          <polygon
            points="12,8 14,11 10,11"
            fill="#38BDF8"
          />
        </svg>
      </div>

      {showText && (
        <span className={`${currentSize.text} font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors`}>
          ULTIMATUM<span className="text-cyan-400">.</span>
        </span>
      )}
    </div>
  );
}
