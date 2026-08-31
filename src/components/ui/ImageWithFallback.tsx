import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export function ImageWithFallback({ src, alt, className = '' }: { src?: string, alt: string, className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(!src);

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex flex-col items-center justify-center text-white/75 ${className}`}>
        <ImageIcon className="w-8 h-8 opacity-60 mb-2" />
        <span className="text-xs font-medium tracking-wide">Community update</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
