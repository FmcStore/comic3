// src/utils/offlineStorage.ts
export const saveChapterForOffline = async (
  comicSlug: string,
  chapterSlug: string,
  images: string[]
) => {
  const key = `offline_${comicSlug}_${chapterSlug}`;
  
  // Save images to cache
  const cache = await caches.open('offline-chapters');
  await Promise.all(
    images.map((url, index) => 
      cache.put(`${key}_${index}`, await fetch(url))
    )
  );
  
  // Save metadata
  const metadata = {
    comicSlug,
    chapterSlug,
    images: images.map((_, i) => `${key}_${i}`),
    savedAt: new Date().toISOString()
  };
  
  localStorage.setItem(key, JSON.stringify(metadata));
};
