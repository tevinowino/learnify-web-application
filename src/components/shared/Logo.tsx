
'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'; // Removed useState, useEffect

interface LogoProps {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function Logo({ className, onClick }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className || ''}`}
      onClick={onClick}
      aria-label="Learnify Homepage"
    >
      <Image src="/logo-icon.png" width={32} height={32} alt="Learnify Logo Icon" priority />
      <span>Learnify</span>
    </Link>
  );
}
