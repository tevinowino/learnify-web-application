'use client'; // Make Logo a client component

import Image from 'next/image';
import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import Link from 'next/link';

interface LogoProps {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export default function Logo({ className, onClick }: LogoProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Link
      href="/"
      className={`flex items-center space-x-2 text-2xl font-bold text-primary ${className || ''}`}
      onClick={onClick}
      aria-label="Learnify Homepage"
    >
      {hasMounted ? (
        <Image src="/logo-icon.png" width={32} height={32} alt="Learnify Logo Icon" />
      ) : (
        // Placeholder to match dimensions, prevent layout shift and hydration mismatch for Image
        <div style={{ width: 32, height: 32 }} aria-hidden="true"></div>
      )}
      <span>Learnify</span>
    </Link>
  );
}
