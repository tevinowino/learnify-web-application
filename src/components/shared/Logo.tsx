import { BookHeart } from 'lucide-react';
import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    // The Link component is removed from here as it caused nesting issues.
    // The parent component (Navbar) will wrap this with a Link.
    <div className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <BookHeart className="h-8 w-8" />
      <span>Learnify</span>
    </div>
  );
}
