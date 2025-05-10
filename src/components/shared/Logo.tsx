
import Image from 'next/image';
import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <Image src="/logo-icon.png" width={40} height={40} alt="Learnify Logo"></Image>
      <span>Learnify</span>
    </div>
  );
}
