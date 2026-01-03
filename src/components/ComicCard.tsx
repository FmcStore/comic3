import React from 'react';
import { Comic } from '../utils/types';
import { motion } from 'framer-motion';

interface ComicCardProps {
  comic: Comic;
  onClick: () => void;
  showProgress?: boolean;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
  showType?: boolean;
}

const ComicCard: React.FC<ComicCardProps> = ({ 
  comic, 
  onClick, 
  showProgress = false, 
  progress = 0,
  size = 'medium',
  showType = false
}) => {
  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('manga')) return 'bg-blue-600';
    if (t.includes('manhwa')) return 'bg-green-600';
    if (t.includes('manhua')) return 'bg-red-600';
    return 'bg-gray-600';
  };

  const sizeClasses = {
    small: 'h-48',
    medium: 'h-64',
    large: 'h-80'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/40 transition-all duration-300 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/20"
    >
      {/* Progress Bar */}
      {showProgress && progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-700 z-10">
          <div 
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Type Badge */}
      {showType && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getTypeColor(comic.type)}`}>
          {comic.type}
        </div>
      )}

      {/* Continue Reading Badge */}
      {progress > 0 && progress < 100 && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500">
          Lanjut Baca
        </div>
      )}

      {/* Image */}
      <div className={`relative ${sizeClasses[size]} overflow-hidden`}>
        <img
          src={comic.image}
          alt={comic.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-amber-500 transition-colors">
          {comic.title}
        </h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-amber-500 text-xs font-medium">
            {comic.latestChapter || 'Baca'}
          </span>
          {progress > 0 && (
            <span className="text-gray-400 text-xs">
              {progress.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ComicCard;
