import { BookHeart } from 'lucide-react';
import React from 'react';

interface LogoProps {
  className?: string;
}

// This component now only renders the visual content of the logo
export default function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className || ''}`}>
      <BookHeart className="h-8 w-8" />
      <span>Learnify</span>
    </div>
  );
}
