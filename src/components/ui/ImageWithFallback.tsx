import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export function ImageWithFallback({ src, alt, className = '' }: { src?: string, alt: string, className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(!src);

  if (error) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center text-gray-400 ${className}`}>
        <ImageIcon className="w-8 h-8 opacity-30 mb-2" />
        <span className="text-xs font-medium">No Image</span>
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
