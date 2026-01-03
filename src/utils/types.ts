export interface Comic {
  slug: string;
  title: string;
  image: string;
  type: 'manga' | 'manhwa' | 'manhua' | 'other';
  status: 'ongoing' | 'completed';
  rating: string;
  genres: { title: string }[];
  synopsis: string;
  chapters: Chapter[];
  latestChapter?: string;
}

export interface Chapter {
  slug: string;
  title: string;
  date?: string;
  images: string[];
  navigation: {
    prev: string | null;
    next: string | null;
  };
}

export interface ReadingProgress {
  comicSlug: string;
  chapterSlug: string;
  chapterTitle: string;
  progress: number; // 0-100
  lastRead: Date;
}

export interface Bookmark {
  slug: string;
  title: string;
  image: string;
  type: string;
  lastReadAt: Date;
  progress: number;
}

export interface HistoryItem {
  slug: string;
  title: string;
  image: string;
  lastChapterSlug: string;
  lastChapterTitle: string;
  readAt: Date;
}
