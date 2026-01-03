import { Comic, Chapter } from './api'

export interface ReadingProgress {
  comicSlug: string
  chapterSlug: string
  chapterTitle: string
  progress: number // 0-100
  lastRead: string
  totalChapters: number
  readChapters: string[]
}

export interface Bookmark {
  comic: Comic
  addedAt: string
  lastRead?: {
    chapterSlug: string
    chapterTitle: string
    progress: number
    date: string
  }
}

export interface HistoryItem {
  comic: Comic
  chapter: {
    slug: string
    title: string
  }
  readAt: string
  progress: number
}

class StorageManager {
  private readonly PREFIX = 'fmc_'

  // Reading Progress
  saveProgress(comicSlug: string, chapterSlug: string, chapterTitle: string, progress: number, totalChapters: number) {
    const key = `${this.PREFIX}progress_${comicSlug}`
    const progressData: ReadingProgress = {
      comicSlug,
      chapterSlug,
      chapterTitle,
      progress,
      lastRead: new Date().toISOString(),
      totalChapters,
      readChapters: this.getReadChapters(comicSlug, chapterSlug)
    }
    
    localStorage.setItem(key, JSON.stringify(progressData))
  }

  getProgress(comicSlug: string): ReadingProgress | null {
    const data = localStorage.getItem(`${this.PREFIX}progress_${comicSlug}`)
    return data ? JSON.parse(data) : null
  }

  private getReadChapters(comicSlug: string, currentChapter: string): string[] {
    const existing = this.getProgress(comicSlug)
    const readChapters = existing?.readChapters || []
    
    if (!readChapters.includes(currentChapter)) {
      readChapters.push(currentChapter)
    }
    
    return readChapters
  }

  // Bookmarks
  toggleBookmark(comic: Comic): boolean {
    const bookmarks = this.getBookmarks()
    const existingIndex = bookmarks.findIndex(b => b.comic.slug === comic.slug)
    
    if (existingIndex > -1) {
      bookmarks.splice(existingIndex, 1)
      localStorage.setItem(`${this.PREFIX}bookmarks`, JSON.stringify(bookmarks))
      return false // Removed
    } else {
      bookmarks.push({
        comic,
        addedAt: new Date().toISOString()
      })
      localStorage.setItem(`${this.PREFIX}bookmarks`, JSON.stringify(bookmarks))
      return true // Added
    }
  }

  getBookmarks(): Bookmark[] {
    const data = localStorage.getItem(`${this.PREFIX}bookmarks`)
    return data ? JSON.parse(data) : []
  }

  isBookmarked(comicSlug: string): boolean {
    return this.getBookmarks().some(b => b.comic.slug === comicSlug)
  }

  // History
  addHistory(comic: Comic, chapter: { slug: string; title: string }, progress: number) {
    const history = this.getHistory()
    
    // Remove existing entry for this comic
    const filteredHistory = history.filter(h => h.comic.slug !== comic.slug)
    
    filteredHistory.unshift({
      comic,
      chapter,
      readAt: new Date().toISOString(),
      progress
    })
    
    // Keep only last 50 items
    const limitedHistory = filteredHistory.slice(0, 50)
    localStorage.setItem(`${this.PREFIX}history`, JSON.stringify(limitedHistory))
  }

  getHistory(): HistoryItem[] {
    const data = localStorage.getItem(`${this.PREFIX}history`)
    return data ? JSON.parse(data) : []
  }

  clearHistory() {
    localStorage.removeItem(`${this.PREFIX}history`)
  }

  // Theme
  getTheme(): 'dark' | 'light' {
    const theme = localStorage.getItem(`${this.PREFIX}theme`)
    return (theme as 'dark' | 'light') || 'dark'
  }

  setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(`${this.PREFIX}theme`, theme)
  }

  // Reader Settings
  getReaderSettings() {
    const defaultSettings = {
      mode: 'vertical' as 'vertical' | 'horizontal',
      quality: 'high' as 'low' | 'medium' | 'high',
      autoNext: true,
      showProgress: true
    }
    
    const settings = localStorage.getItem(`${this.PREFIX}reader_settings`)
    return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings
  }

  saveReaderSettings(settings: any) {
    localStorage.setItem(`${this.PREFIX}reader_settings`, JSON.stringify(settings))
  }

  // Clear all data
  clearAll() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const storage = new StorageManager()
