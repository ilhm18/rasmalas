import { useState } from 'react';
import { Disc3 } from 'lucide-react';
import { resolveAssetUrl } from '../shared/assetUrl';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
}

export function ImageWithFallback({
  src,
  alt,
  title,
  className = '',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1914] via-[#14120E] to-[#0C0B09] text-[#A8A092] p-6 text-center ${className}`}
      >
        <Disc3 className="w-8 h-8 text-[#EAB308]/70 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-[#D6CFC2] max-w-[22ch]">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
