import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface LogoProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export function Logo({ src = "/IMG_0342.JPG", alt = "Zwanan Jawkhela Logo", className, fallbackText = "ZJ" }: LogoProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950 rounded-xl text-accent-400 shadow-sm border border-primary-700/50 ${className}`} style={{ aspectRatio: '1/1' }}>
        <div className="flex flex-col items-center justify-center w-full h-full p-1">
          <Shield className="w-3/5 h-3/5" />
          <span className="font-bold text-[0.6em] tracking-widest font-serif leading-none mt-1">{fallbackText}</span>
        </div>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}
