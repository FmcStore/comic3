import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import ComicCard from '../components/ComicCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { storage, Bookmark } from '../utils/storage'
import { api } from '../utils/api'

const Bookmarks: React.FC = () => {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'progress'>('date')
  const [filterType, setFilterType] = useState<'all' | 'manga' | 'manhwa' | 'manhua'>('all')
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Load bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      setIsLoading(true)
      try {
        const savedBookmarks = storage.getBookmarks()
        setBookmarks(savedBookmarks)
        setFilteredBookmarks(savedBookmarks)
      } catch (error) {
        console.error('Error loading bookmarks:', error)
        toast.error('Gagal memuat bookmark')
      } finally {
        setIsLoading(false)
      }
    }

    loadBookmarks()
  }, [])

  // Filter and sort bookmarks
  useEffect(() => {
    let result = [...bookmarks]

    // Filter by search
    if (searchTerm) {
      result = result.filter(bookmark =>
        bookmark.comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.comic.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(bookmark =>
        bookmark.comic.type.toLowerCase().includes(filterType)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.comic.title.localeCompare(b.comic.title)
        case 'progress':
          const progressA = storage.getProgress(a.comic.slug)?.progress || 0
          const progressB = storage.getProgress(b.comic.slug)?.progress || 0
          return progressB - progressA
        case 'date':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      }
    })

    setFilteredBookmarks(result)
  }, [bookmarks, searchTerm, sortBy, filterType])

  // Handle comic click
  const handleComicClick = async (bookmark: Bookmark) => {
    if (isSelectMode) {
      // Toggle selection
      const slug = bookmark.comic.slug
      setSelectedBookmarks(prev =>
        prev.includes(slug)
          ? prev.filter(s => s !== slug)
          : [...prev, slug]
      )
      return
    }

    try {
      const uuid = await api.getUuid(bookmark.comic.slug, 'series')
      navigate(uuid ? `/series/${uuid}` : `/series/${bookmark.comic.slug}`)
    } catch (error) {
      console.error('Error navigating:', error)
      navigate(`/series/${bookmark.comic.slug}`)
    }
  }

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    if (!isSelectMode) {
      setSelectedBookmarks([])
    }
  }

  // Delete selected bookmarks
  const deleteSelected = () => {
    if (selectedBookmarks.length === 0) return

    const newBookmarks = bookmarks.filter(
      bookmark => !selectedBookmarks.includes(bookmark.comic.slug)
    )
    
    // Update storage
    selectedBookmarks.forEach(slug => {
      const bookmark = bookmarks.find(b => b.comic.slug === slug)
      if (bookmark) {
        storage.toggleBookmark(bookmark.comic)
      }
    })
    
    setBookmarks(newBookmarks)
    setSelectedBookmarks([])
    setIsSelectMode(false)
    
    toast.success(`Dihapus ${selectedBookmarks.length} bookmark`)
  }

  // Clear all bookmarks
  const clearAllBookmarks = () => {
    if (bookmarks.length === 0) return

    if (window.confirm(`Yakin hapus semua ${bookmarks.length} bookmark?`)) {
      bookmarks.forEach(bookmark => {
        storage.toggleBookmark(bookmark.comic)
      })
      
      setBookmarks([])
      setSelectedBookmarks([])
      setIsSelectMode(false)
      
      toast.success('Semua bookmark telah dihapus')
    }
  }

  // Get progress for a comic
  const getProgress = (slug: string) => {
    const progress = storage.getProgress(slug)
    return progress?.progress || 0
  }

  // Get last read info
  const getLastReadInfo = (bookmark: Bookmark) => {
    const progress = storage.getProgress(bookmark.comic.slug)
    if (progress) {
      return {
        chapter: progress.chapterTitle,
        progress: progress.progress,
        date: new Date(progress.lastRead).toLocaleDateString('id-ID')
      }
    }
    return null
  }

  if (isLoading) {
    return <LoadingSpinner message="Memuat bookmark..." />
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bookmark</h1>
            <p className="text-gray-400">
              {bookmarks.length} komik tersimpan
            </p>
          </div>

          <div className="flex gap-3">
            {bookmarks.length > 0 && (
              <>
                <button
                  onClick={toggleSelectMode}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    isSelectMode
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <i className={`fas fa-${isSelectMode ? 'check' : 'check-double'} mr-2`}></i>
                  {isSelectMode ? 'Batal Pilih' : 'Pilih'}
                </button>

                {isSelectMode && selectedBookmarks.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Hapus ({selectedBookmarks.length})
                  </button>
                )}

                <button
                  onClick={clearAllBookmarks}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-medium transition"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  Hapus Semua
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari bookmark..."
              className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none pl-12"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none"
          >
            <option value="date">Terbaru Disimpan</option>
            <option value="title">A-Z</option>
            <option value="progress">Progress Membaca</option>
          </select>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Semua Tipe</option>
            <option value="manga">Manga</option>
            <option value="manhwa">Manhwa</option>
            <option value="manhua">Manhua</option>
          </select>
        </div>

        {/* Selected Count */}
        <AnimatePresence>
          {isSelectMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <i className="fas fa-check text-black"></i>
                  </div>
                  <div>
                    <h3 className="font-bold">Mode Pilihan</h3>
                    <p className="text-sm text-gray-400">
                      {selectedBookmarks.length} komik terpilih
                    </p>
                  </div>
                </div>
                <button
                  onClick={deleteSelected}
                  disabled={selectedBookmarks.length === 0}
                  className={`px-4 py-2 rounded-xl font-medium ${
                    selectedBookmarks.length > 0
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Hapus Terpilih
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">
            {searchTerm ? '🔍' : '📚'}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {searchTerm ? 'Bookmark tidak ditemukan' : 'Belum ada bookmark'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchTerm
              ? `Tidak ada bookmark yang cocok dengan "${searchTerm}"`
              : 'Simpan komik favoritmu dengan menekan tombol bookmark di halaman detail komik'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
            >
              Hapus Pencarian
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
            >
              Jelajahi Komik
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredBookmarks.map((bookmark, index) => {
                const progress = getProgress(bookmark.comic.slug)
                const lastReadInfo = getLastReadInfo(bookmark)
                const isSelected = selectedBookmarks.includes(bookmark.comic.slug)

                return (
                  <motion.div
                    key={bookmark.comic.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Selection Overlay */}
                    {isSelectMode && (
                      <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden">
                        <div 
                          className={`absolute inset-0 ${
                            isSelected ? 'bg-amber-500/30' : 'bg-black/60'
                          }`}
                        />
                        <div className="absolute top-3 left-3 z-20">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-amber-500 text-black' 
                              : 'bg-white/20 text-white'
                          }`}>
                            {isSelected ? (
                              <i className="fas fa-check"></i>
                            ) : (
                              <i className="fas fa-plus"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <ComicCard
                      comic={bookmark.comic}
                      onClick={() => handleComicClick(bookmark)}
                      showProgress={true}
                      progress={progress}
                      size="medium"
                    />

                    {/* Last Read Info */}
                    {lastReadInfo && !isSelectMode && (
                      <div className="mt-2 p-3 bg-zinc-900/50 rounded-xl">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Terakhir baca</span>
                          <span className="text-amber-500">{lastReadInfo.progress}%</span>
                        </div>
                        <p className="text-xs truncate" title={lastReadInfo.chapter}>
                          {lastReadInfo.chapter}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{lastReadInfo.date}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="mt-12 p-6 bg-zinc-900/30 rounded-2xl">
            <h3 className="text-lg font-bold mb-4">Statistik Bookmark</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-amber-500 mb-1">
                  {bookmarks.length}
                </div>
                <div className="text-sm text-gray-400">Total Bookmark</div>
              </div>
              
              <div className="bg-zinc-900/50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {bookmarks.filter(b => getProgress(b.comic.slug) >= 90).length}
                </div>
                <div className="text-sm text-gray-400">Hampir Selesai</div>
              </div>
              
              <div className="bg-zinc-900/50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {bookmarks.filter(b => getProgress(b.comic.slug) === 0).length}
                </div>
                <div className="text-sm text-gray-400">Belum Dibaca</div>
              </div>
              
              <div className="bg-zinc-900/50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-purple-500 mb-1">
                  {[...new Set(bookmarks.map(b => b.comic.type))].length}
                </div>
                <div className="text-sm text-gray-400">Jenis Komik</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Bookmarks
