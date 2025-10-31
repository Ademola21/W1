import React, { useState, useEffect, useRef } from 'react';
import type { Movie } from '../types';
import { StarIcon } from './icons/StarIcon';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
}

const MovieCardComponent: React.FC<MovieCardProps> = ({ movie, onSelectMovie }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px -50px 0px',
        threshold: 0,
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  
  return (
    <div
      ref={cardRef}
      onClick={() => onSelectMovie(movie)}
      className={`group bg-white dark:bg-background-secondary rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/30 cursor-pointer shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-gray-700/50 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ willChange: 'transform, opacity, box-shadow' }}
    >
      <div className="relative aspect-[2/3] bg-background-secondary">
        {!isImageLoaded && <div className="absolute inset-0 bg-background-tertiary animate-pulse" />}
        <img 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-75 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          src={movie.posterUrl} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsImageLoaded(true)}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-100 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {movie.part && movie.part > 1 && (
            <div className="absolute top-2 left-2 flex items-center bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                Part {movie.part}
            </div>
        )}

        <div className="absolute top-2 right-2 flex items-center bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-2.5 py-1.5 rounded-full z-10">
          <StarIcon className="w-4 h-4 text-yellow-400 mr-1.5" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="p-3">
          <h3 className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300">
              {movie.title}
          </h3>
          <div className="flex justify-between items-center mt-1.5 text-sm text-gray-600 dark:text-text-muted">
            <span>{movie.genres[0]}</span>
            <span>{movie.year}</span>
          </div>
      </div>
    </div>
  );
};

export const MovieCard = React.memo(MovieCardComponent);