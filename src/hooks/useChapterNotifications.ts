// src/hooks/useChapterNotifications.ts
export const useChapterNotifications = () => {
  const checkNewChapters = async (bookmarks: Bookmark[]) => {
    const newChapters = [];
    
    for (const bookmark of bookmarks) {
      const detail = await api.detail(bookmark.slug);
      if (detail) {
        const lastChapter = detail.chapters[0];
        const lastRead = localStorage.getItem(`last_chapter_${bookmark.slug}`);
        
        if (lastChapter.slug !== lastRead) {
          newChapters.push({
            comic: bookmark,
            chapter: lastChapter
          });
        }
      }
    }
    
    if (newChapters.length > 0 && Notification.permission === 'granted') {
      newChapters.forEach(({ comic, chapter }) => {
        new Notification(`${comic.title}`, {
          body: `Chapter baru: ${chapter.title}`,
          icon: comic.image
        });
      });
    }
  };
  
  return { checkNewChapters };
};
