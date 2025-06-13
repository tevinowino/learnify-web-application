
"use client";

import Image from 'next/image';
import React from 'react';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ message, size = 'medium', className = '' }) => {
  const imageSize = size === 'small' ? 32 : size === 'medium' ? 56 : 80;
  const textSize = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <Image
          src="/logo-icon.png"
          alt="Learnify Logo loading"
          width={imageSize}
          height={imageSize}
          className="animate-pulse opacity-75"
          priority 
        />
      </div>
      {message && <p className={`text-muted-foreground ${textSize} mt-1`}>{message}</p>}
    </div>
  );
};

export default Loader;

