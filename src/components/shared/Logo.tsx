import { BookHeart } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link'; // Added import

interface LogoProps {
  className?: string;
}

// This component now only renders the visual content of the logo
export default function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className}`}>
      <Image src="/logo-full.png" alt="Learnify Logo" width={150} height={150}></Image>
    </Link>
  );
}
