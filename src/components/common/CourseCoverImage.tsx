import React, { useState } from 'react';
import { getCourseCoverUrl, getCourseFallbackSvg } from '../../utils/courseCovers';

interface CourseCoverImageProps {
  code: string;
  title: string;
  bannerImage?: string;
  className?: string;
  eager?: boolean;
}

export const CourseCoverImage: React.FC<CourseCoverImageProps> = ({
  code,
  title,
  bannerImage,
  className = 'w-full h-full object-cover',
  eager = false
}) => {
  const primaryUrl = bannerImage && bannerImage.startsWith('http') 
    ? bannerImage 
    : getCourseCoverUrl(code);

  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl);
  const [hasErrored, setHasErrored] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const handleError = () => {
    if (!hasErrored) {
      setHasErrored(true);
      // Fallback immediately to mathematical SVG representation
      setCurrentSrc(getCourseFallbackSvg(code));
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <img
        src={currentSrc}
        alt={title}
        referrerPolicy="no-referrer"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-85' : 'opacity-40'
        }`}
      />
    </div>
  );
};
