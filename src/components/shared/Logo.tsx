
import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      {/* Placeholder SVG for logo.svg */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8" // Adjusted size to match previous BookHeart icon
        aria-hidden="true"
      >
        <path
          d="M4 19.5V4.5C4 3.94772 4.44772 3.5 5 3.5H19C19.5523 3.5 20 3.94772 20 4.5V19.5C20 20.0523 19.5523 20.5 19 20.5H5C4.44772 20.5 4 20.0523 4 19.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M12 16.5V7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
         <path
          d="M9 10.5L12 7.5L15 10.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Learnify</span>
    </div>
  );
}
