import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'
import ComicCard from '../components/ComicCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { storage, HistoryItem } from '../utils/storage'
import { api } from '../utils/api'

dayjs.extend(relativeTime)
dayjs.locale('id')

const History: React.FC = () => {
  const navigate = useNavigate()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [groupedHistory, setGroupedHistory] = useState<Record<string, HistoryItem[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const savedHistory = storage.getHistory()
        setHistory(savedHistory)
        groupHistoryByDate(savedHistory)
      } catch (error) {
        console.error('Error loading history:', error)
        toast.error('Gagal memuat riwayat')
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

  // Group history by date
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const grouped: Record<string, HistoryItem[]> = {}
    
    items.forEach(item => {
      const date = dayjs(item.readAt).format('YYYY-MM-DD')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(item)
    })
    
    setGroupedHistory(grouped)
  }

  // Filter history
  useEffect(() => {
    let filtered = [...history]

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date
    const now = dayjs()
    if (filterDate !== 'all') {
      filtered = filtered.filter(item => {
        const readDate = dayjs(item.readAt)
        switch (filterDate) {
          case 'today':
            return readDate.isSame(now, 'day')
          case 'week':
            return readDate.isSame(now, 'week')
          case 'month':
            return readDate.isSame(now, 'month')
          default:
            return true
        }
      })
    }

    groupHistoryByDate(filtered)
  }, [history, searchTerm, filterDate])

  // Handle comic click
  const handleComicClick = async (item: HistoryItem) => {
    if (isSelectMode) {
      const key = `${item.comic.slug}-${item.chapter.slug}`
      setSelectedItems(prev =>
        prev.includes(key)
          ? prev.filter(k => k !== key)
          : [...prev, key]
      )
      return
    }

    try {
      const uuid = await api.getUuid(item.comic.slug, 'series')
      navigate(uuid ? `/series/${uuid}` : `/series/${item.comic.slug}`)
    } catch (error) {
      console.error('Error navigating:', error)
      navigate(`/series/${item.comic.slug}`)
    }
  }

  // Handle chapter click
  const handleChapterClick = async (item: HistoryItem) => {
    try {
      const uuid = await api.getUuid(item.chapter.slug, 'chapter')
      navigate(uuid ? `/chapter/${uuid}` : `/chapter/${item.chapter.slug}`)
    } catch (error) {
      console.error('Error navigating:', error)
      navigate(`/chapter/${item.chapter.slug}`)
    }
  }

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    if (!isSelectMode) {
      setSelectedItems([])
    }
  }

  // Delete selected items
  const deleteSelected = () => {
    if (selectedItems.length === 0) return

    const newHistory = history.filter(item => {
      const key = `${item.comic.slug}-${item.chapter.slug}`
      return !selectedItems.includes(key)
    })
    
    setHistory(newHistory)
    setSelectedItems([])
    setIsSelectMode(false)
    
    // Update storage
    const historyKeys = selectedItems.map(key => {
      const [comicSlug, chapterSlug] = key.split('-')
      return { comicSlug, chapterSlug }
    })
    
    // Note: Need to implement remove from storage
    toast.success(`Dihapus ${selectedItems.length} riwayat`)
  }

  // Clear all history
  const clearAllHistory = () => {
    if (history.length === 0) return

    if (window.confirm(`Yakin hapus semua ${history.length} riwayat?`)) {
      storage.clearHistory()
      setHistory([])
      setGroupedHistory({})
      setSelectedItems([])
      setIsSelectMode(false)
      
      toast.success('Semua riwayat telah dihapus')
    }
  }

  // Format date
  const formatDate = (date: string) => {
    const dayjsDate = dayjs(date)
    const today = dayjs()
    
    if (dayjsDate.isSame(today, 'day')) {
      return 'Hari Ini'
    } else if (dayjsDate.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Kemarin'
    } else if (dayjsDate.isSame(today, 'week')) {
      return 'Minggu Ini'
    } else {
      return dayjsDate.format('DD MMMM YYYY')
    }
  }

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-500'
    if (progress >= 50) return 'text-amber-500'
    return 'text-blue-500'
  }

  if (isLoading) {
    return <LoadingSpinner message="Memuat riwayat..." />
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Riwayat Baca</h1>
            <p className="text-gray-400">
              {history.length} chapter dibaca
            </p>
          </div>

          <div className="flex gap-3">
            {history.length > 0 && (
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

                {isSelectMode && selectedItems.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Hapus ({selectedItems.length})
                  </button>
                )}

                <button
                  onClick={clearAllHistory}
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
              placeholder="Cari riwayat..."
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

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value as any)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
          </select>

          {/* Sort */}
          <button className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 hover:border-amber-500 transition">
            <i className="fas fa-sort-amount-down mr-2"></i>
            Terbaru
          </button>
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
                    <i className="fas fa-history text-black"></i>
                  </div>
                  <div>
                    <h3 className="font-bold">Mode Pilihan</h3>
                    <p className="text-sm text-gray-400">
                      {selectedItems.length} riwayat terpilih
                    </p>
                  </div>
                </div>
                <button
                  onClick={deleteSelected}
                  disabled={selectedItems.length === 0}
                  className={`px-4 py-2 rounded-xl font-medium ${
                    selectedItems.length > 0
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

      {/* History List */}
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">
            {searchTerm ? '🔍' : '📖'}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {searchTerm ? 'Riwayat tidak ditemukan' : 'Belum ada riwayat'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {searchTerm
              ? `Tidak ada riwayat yang cocok dengan "${searchTerm}"`
              : 'Riwayat baca akan muncul di sini setelah kamu mulai membaca komik'}
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
              Mulai Membaca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <h2 className="text-xl font-bold whitespace-nowrap">
                  {formatDate(date)}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* History Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, index) => {
                  const key = `${item.comic.slug}-${item.chapter.slug}`
                  const isSelected = selectedItems.includes(key)
                  const progressColor = getProgressColor(item.progress)
                  const timeAgo = dayjs(item.readAt).fromNow()

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={`bg-zinc-900/50 border rounded-2xl p-4 transition-all ${
                          isSelectMode
                            ? isSelected
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-white/10 hover:border-amber-500/30'
                            : 'border-white/10 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Comic Cover */}
                          <div className="relative">
                            <img
                              src={item.comic.image}
                              alt={item.comic.title}
                              className="w-20 h-28 object-cover rounded-xl"
                            />
                            {isSelectMode && (
                              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-amber-500 text-black' 
                                  : 'bg-white/20 text-white'
                              }`}>
                                {isSelected ? (
                                  <i className="fas fa-check text-xs"></i>
                                ) : (
                                  <i className="fas fa-plus text-xs"></i>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h3 
                                className="font-bold truncate hover:text-amber-500 cursor-pointer"
                                onClick={() => handleComicClick(item)}
                              >
                                {item.comic.title}
                              </h3>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {timeAgo}
                              </span>
                            </div>

                            <p 
                              className="text-sm text-gray-300 mb-2 truncate hover:text-amber-400 cursor-pointer"
                              onClick={() => handleChapterClick(item)}
                            >
                              <i className="fas fa-bookmark text-xs mr-2"></i>
                              {item.chapter.title}
                            </p>

                            {/* Progress */}
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-4">
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      item.progress >= 90 ? 'bg-green-500' :
                                      item.progress >= 50 ? 'bg-amber-500' :
                                      'bg-blue-500'
                                    }`}
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                              <span className={`text-sm font-bold ${progressColor}`}>
                                {item.progress}%
                              </span>
                            </div>

                            {/* Actions */}
                            {!isSelectMode && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleChapterClick(item)}
                                  className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs rounded-lg hover:bg-amber-500/30 transition"
                                >
                                  <i className="fas fa-play mr-1"></i>
                                  Lanjut Baca
                                </button>
                                <button
                                  onClick={() => handleComicClick(item)}
                                  className="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition"
                                >
                                  <i className="fas fa-info-circle mr-1"></i>
                                  Detail
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {history.length > 0 && (
        <div className="mt-12 p-6 bg-zinc-900/30 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Statistik Membaca</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-amber-500 mb-1">
                {history.length}
              </div>
              <div className="text-sm text-gray-400">Total Dibaca</div>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {[...new Set(history.map(h => h.comic.slug))].length}
              </div>
              <div className="text-sm text-gray-400">Komik Berbeda</div>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {Math.max(...history.map(h => h.progress), 0)}%
              </div>
              <div className="text-sm text-gray-400">Progress Tertinggi</div>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {history.length > 0 
                  ? dayjs(history[0].readAt).format('DD/MM')
                  : '-'
                }
              </div>
              <div className="text-sm text-gray-400">Terakhir Baca</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History
