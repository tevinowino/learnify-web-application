
import Image from 'next/image';
import React from 'react';
import Link from 'next/link'; // Import Link

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    // Wrap the content with Link for navigation
    <Link href="/" className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <Image src="/logo-icon.png" width={32} height={32} alt="Learnify Logo"></Image>
      <span>Learnify</span>
    </Link>
  );
}
