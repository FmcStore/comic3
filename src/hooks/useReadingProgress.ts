import { useState, useEffect } from 'react';
import { ReadingProgress } from '../utils/types';

export const useReadingProgress = () => {
  const [progress, setProgress] = useState<ReadingProgress[]>(() => {
    const saved = localStorage.getItem('fmc_reading_progress');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fmc_reading_progress', JSON.stringify(progress));
  }, [progress]);

  const updateProgress = (
    comicSlug: string, 
    chapterSlug: string, 
    chapterTitle: string, 
    progressPercentage: number
  ) => {
    setProgress(prev => {
      const filtered = prev.filter(p => p.comicSlug !== comicSlug);
      return [
        {
          comicSlug,
          chapterSlug,
          chapterTitle,
          progress: progressPercentage,
          lastRead: new Date()
        },
        ...filtered
      ].slice(0, 50); // Keep last 50 items
    });
  };

  const getProgress = (comicSlug: string): number => {
    const item = progress.find(p => p.comicSlug === comicSlug);
    return item?.progress || 0;
  };

  const clearProgress = (comicSlug?: string) => {
    if (comicSlug) {
      setProgress(prev => prev.filter(p => p.comicSlug !== comicSlug));
    } else {
      setProgress([]);
    }
  };

  return {
    progress,
    updateProgress,
    getProgress,
    clearProgress
  };
};
