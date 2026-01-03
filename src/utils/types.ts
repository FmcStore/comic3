export interface Comic {
  slug: string;
  title: string;
  image: string;
  type: string;
  status: string;
  rating?: string;
  genres?: Array<{ title: string }>;
  synopsis?: string;
  chapters?: Chapter[];
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

export interface ApiResponse {
  success: boolean;
  result?: any;
  data?: any;
  content?: any;
}
