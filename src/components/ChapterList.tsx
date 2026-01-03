import React, { useState } from 'react'
import { Chapter } from '../utils/api'
import { storage } from '../utils/storage'

interface ChapterListProps {
  chapters: Chapter[]
  onChapterClick: (chapterSlug: string, chapterTitle: string) => void
  comicSlug: string
  lastReadChapter?: string | null
}

const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  onChapterClick,
  comicSlug,
  lastReadChapter
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Filter and sort chapters
  const filteredChapters = chapters
    .filter(chapter => 
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        // Assuming newer chapters have higher numbers or later dates
        return b.title.localeCompare(a.title)
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  // Check if chapter is read
  const isChapterRead = (chapterSlug: string) => {
    const progress = storage.getProgress(comicSlug)
    return progress?.readChapters?.includes(chapterSlug) || false
  }

  // Format chapter title
  const formatChapterTitle = (title: string) => {
    return title.replace(/-/g, ' ').replace(/chapter/gi, 'Chapter ')
  }

  // Handle chapter click
  const handleChapterClick = (chapter: Chapter) => {
    onChapterClick(chapter.slug, chapter.title)
  }

  // Get chapter number
  const getChapterNumber = (title: string) => {
    const match = title.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari chapter..."
            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none pl-10"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl hover:border-amber-500/50 transition"
          >
            <i className={`fas fa-sort-amount-${sortOrder === 'newest' ? 'down' : 'up'} mr-2`}></i>
            {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
          </button>

          <button
            onClick={() => {
              const unreadChapters = chapters.filter(ch => !isChapterRead(ch.slug))
              if (unreadChapters.length > 0) {
                const newestUnread = unreadChapters[0]
                handleChapterClick(newestUnread)
              }
            }}
            className="px-4 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition"
          >
            <i className="fas fa-forward mr-2"></i>
            Chapter Belum Baca
          </button>
        </div>
      </div>

      {/* Chapter Count */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-gray-400">
          Menampilkan {filteredChapters.length} dari {chapters.length} chapter
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-amber-500 hover:text-amber-400"
          >
            Hapus pencarian
          </button>
        )}
      </div>

      {/* Chapters List */}
      <div className="max-h-[600px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredChapters.map((chapter, index) => {
            const isRead = isChapterRead(chapter.slug)
            const isLastRead = lastReadChapter === chapter.slug
            const chapterNumber = getChapterNumber(chapter.title)

            return (
              <button
                key={index}
                onClick={() => handleChapterClick(chapter)}
                className={`
                  relative p-4 rounded-xl text-left transition-all duration-300
                  ${isRead 
                    ? 'bg-zinc-800/30 text-gray-500 hover:bg-zinc-800/50' 
                    : 'bg-zinc-800/50 hover:bg-amber-500/10 hover:border-amber-500/30'
                  }
                  ${isLastRead 
                    ? 'border-2 border-amber-500/50 bg-amber-500/10' 
                    : 'border border-transparent'
                  }
                  hover:scale-[1.02] active:scale-95
                `}
              >
                {/* Last Read Indicator */}
                {isLastRead && (
                  <div className="absolute -top-2 -left-2 px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    LANJUT
                  </div>
                )}

                {/* Read Indicator */}
                {isRead && !isLastRead && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full"></div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1 line-clamp-1">
                      {formatChapterTitle(chapter.title)}
                    </h4>
                    {chapter.date && (
                      <p className="text-xs text-gray-500">
                        <i className="far fa-clock mr-1"></i>
                        {new Date(chapter.date).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isRead && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        ✓ Dibaca
                      </span>
                    )}
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>

                {/* Chapter Number */}
                {chapterNumber > 0 && (
                  <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                    #{chapterNumber}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredChapters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">Tidak ditemukan</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm 
                ? `Tidak ada chapter dengan "${searchTerm}"` 
                : 'Tidak ada chapter tersedia'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-amber-500 rounded-xl hover:bg-amber-600 transition"
              >
                Hapus Pencarian
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {chapters.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const firstChapter = chapters[chapters.length - 1] // Oldest first
                handleChapterClick(firstChapter)
              }}
              className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl hover:border-amber-500/50 transition"
            >
              <i className="fas fa-step-backward mr-2"></i>
              Chapter Pertama
            </button>

            <button
              onClick={() => {
                const latestChapter = chapters[0] // Newest first
                handleChapterClick(latestChapter)
              }}
              className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-xl hover:border-amber-500/50 transition"
            >
              <i className="fas fa-step-forward mr-2"></i>
              Chapter Terbaru
            </button>

            <button
              onClick={() => {
                const unreadChapters = chapters.filter(ch => !isChapterRead(ch.slug))
                if (unreadChapters.length > 0) {
                  // Find the earliest unread chapter
                  const earliestUnread = unreadChapters[unreadChapters.length - 1]
                  handleChapterClick(earliestUnread)
                }
              }}
              className="px-4 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition"
            >
              <i className="fas fa-play mr-2"></i>
              Chapter Terlama Belum Dibaca
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChapterList
