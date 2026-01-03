import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useHotkeys } from 'react-hotkeys-hook'
import { api, Chapter as ChapterType } from '../utils/api'
import { storage } from '../utils/storage'
import LoadingSpinner from '../components/LoadingSpinner'

const Chapter: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  
  const [chapterSlug, setChapterSlug] = useState<string | null>(null)
  const [chapter, setChapter] = useState<ChapterType | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadingStates, setLoadingStates] = useState<boolean[]>([])
  const [comicSlug, setComicSlug] = useState<string | null>(null)
  const [comicTitle, setComicTitle] = useState<string>('')
  const [readMode, setReadMode] = useState<'vertical' | 'horizontal'>('vertical')
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('high')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const lastScrollTimeRef = useRef<number>(0)

  // Convert UUID to slug
  useEffect(() => {
    const fetchSlug = async () => {
      if (!uuid) {
        toast.error('Chapter tidak valid')
        navigate('/')
        return
      }

      try {
        const slugData = await api.getSlug(uuid)
        if (slugData) {
          setChapterSlug(slugData.slug)
        } else {
          setChapterSlug(uuid)
        }
      } catch (error) {
        console.error('Error fetching slug:', error)
        setChapterSlug(uuid)
      }
    }

    fetchSlug()
  }, [uuid, navigate])

  // Fetch chapter data
  const { isLoading, error } = useQuery({
    queryKey: ['chapter', chapterSlug],
    queryFn: async () => {
      if (!chapterSlug) return null
      
      const data = await api.chapter(chapterSlug)
      if (data?.data) {
        setChapter(data.data)
        setLoadingStates(new Array(data.data.images.length).fill(false))
        
        // Get comic info from history
        const history = storage.getHistory()
        const lastRead = history.find(h => 
          h.chapter.slug === chapterSlug || 
          h.comic.chapters?.some((c: any) => c.slug === chapterSlug)
        )
        
        if (lastRead) {
          setComicSlug(lastRead.comic.slug)
          setComicTitle(lastRead.comic.title)
        }
        
        return data.data
      }
      return null
    },
    enabled: !!chapterSlug,
  })

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  // Handle scroll for vertical mode
  const handleScroll = useCallback(() => {
    if (readMode !== 'vertical') return
    
    const now = Date.now()
    if (now - lastScrollTimeRef.current > 100) {
      resetControlsTimer()
      lastScrollTimeRef.current = now
    }

    // Update current page based on scroll position
    if (containerRef.current && chapter?.images) {
      const container = containerRef.current
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
      const pageIndex = Math.floor(scrollPercentage * chapter.images.length)
      
      if (pageIndex >= 0 && pageIndex < chapter.images.length) {
        setCurrentPage(pageIndex)
        
        // Save reading progress
        if (comicSlug && chapterSlug) {
          const progress = Math.min(Math.floor(scrollPercentage * 100), 100)
          storage.saveProgress(
            comicSlug,
            chapterSlug,
            chapterSlug.replace(/-/g, ' '),
            progress,
            chapter.images.length
          )
        }
      }
    }
  }, [readMode, chapter, comicSlug, chapterSlug, resetControlsTimer])

  // Keyboard shortcuts
  useHotkeys('right, d, l', () => handleNavigation('next'), { 
    enabled: !isLoading && !!chapter?.navigation.next 
  })
  useHotkeys('left, a, h', () => handleNavigation('prev'), { 
    enabled: !isLoading && !!chapter?.navigation.prev 
  })
  useHotkeys('space, f', () => toggleFullscreen())
  useHotkeys('esc', () => {
    if (isFullscreen) toggleFullscreen()
    else if (comicSlug) navigate(`/series/${comicSlug}`)
  })
  useHotkeys('1, 2, 3', (_, handler) => {
    const key = handler.keys?.[0]
    if (key === '1') setImageQuality('low')
    if (key === '2') setImageQuality('medium')
    if (key === '3') setImageQuality('high')
  })

  // Navigation
  const handleNavigation = async (direction: 'prev' | 'next') => {
    if (!chapter) return

    const targetSlug = direction === 'prev' ? chapter.navigation.prev : chapter.navigation.next
    if (!targetSlug) return

    try {
      const targetUuid = await api.getUuid(targetSlug, 'chapter')
      if (targetUuid) {
        navigate(`/chapter/${targetUuid}`)
      } else {
        navigate(`/chapter/${targetSlug}`)
      }
    } catch (error) {
      console.error('Navigation error:', error)
      navigate(`/chapter/${targetSlug}`)
    }
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Image loading
  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev]
      newStates[index] = true
      return newStates
    })
  }

  // Get image URL based on quality
  const getImageUrl = (url: string) => {
    if (imageQuality === 'low') {
      return url.replace(/(\.(jpg|jpeg|png|webp))$/i, '_low$1')
    } else if (imageQuality === 'medium') {
      return url.replace(/(\.(jpg|jpeg|png|webp))$/i, '_medium$1')
    }
    return url
  }

  // Chapter selection
  const handleChapterSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlug = e.target.value
    if (selectedSlug === chapterSlug) return

    try {
      const selectedUuid = await api.getUuid(selectedSlug, 'chapter')
      if (selectedUuid) {
        navigate(`/chapter/${selectedUuid}`)
      } else {
        navigate(`/chapter/${selectedSlug}`)
      }
    } catch (error) {
      console.error('Chapter select error:', error)
      navigate(`/chapter/${selectedSlug}`)
    }
  }

  // Go to comic detail
  const goToComic = () => {
    if (comicSlug) {
      navigate(`/series/${comicSlug}`)
    } else {
      navigate('/')
    }
  }

  // Download chapter
  const downloadChapter = async () => {
    if (!chapter) return
    
    toast.loading('Menyiapkan download...')
    
    try {
      const images = chapter.images.map((img, i) => ({
        url: img,
        filename: `page_${i + 1}.jpg`
      }))
      
      // Create ZIP (simulated)
      toast.success('Download dimulai!')
    } catch (error) {
      toast.error('Gagal mendownload chapter')
    }
  }

  // Effect for controls timer
  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [resetControlsTimer])

  // Effect for scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (container && readMode === 'vertical') {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, readMode])

  if (isLoading) return <LoadingSpinner message="Memuat chapter..." />
  if (error || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-4">Chapter tidak ditemukan</h1>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  const totalPages = chapter.images.length
  const progressPercentage = Math.floor(((currentPage + 1) / totalPages) * 100)

  return (
    <div 
      className="min-h-screen bg-black"
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
    >
      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={goToComic}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <i className="fas fa-arrow-left text-xl"></i>
                  </button>
                  
                  <div className="max-w-xs">
                    <h1 className="text-sm font-bold truncate">
                      {comicTitle || chapterSlug?.replace(/-/g, ' ')}
                    </h1>
                    <p className="text-xs text-gray-400">
                      Page {currentPage + 1} of {totalPages}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Read Mode Selector */}
                  <select
                    value={readMode}
                    onChange={(e) => setReadMode(e.target.value as any)}
                    className="bg-black/80 text-white border border-white/20 rounded-lg text-sm px-3 py-1"
                  >
                    <option value="vertical">Vertical Scroll</option>
                    <option value="horizontal">Horizontal</option>
                  </select>

                  {/* Quality Selector */}
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as any)}
                    className="bg-black/80 text-white border border-white/20 rounded-lg text-sm px-3 py-1"
                  >
                    <option value="high">High Quality</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low Quality</option>
                  </select>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'} text-xl`}></i>
                  </button>

                  {/* Settings */}
                  <button className="p-2 hover:bg-white/10 rounded-lg transition">
                    <i className="fas fa-cog text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{currentPage + 1} / {totalPages}</span>
                  <span>{progressPercentage}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Chapter Navigation */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleNavigation('prev')}
                    disabled={!chapter.navigation.prev}
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      chapter.navigation.prev
                        ? 'bg-amber-500 text-black hover:bg-amber-600'
                        : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <i className="fas fa-chevron-left"></i>
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Chapter Selector */}
                  <div className="relative">
                    <select
                      value={chapterSlug || ''}
                      onChange={handleChapterSelect}
                      className="bg-black/80 text-white border border-white/20 rounded-lg px-4 py-2 appearance-none pr-8"
                    >
                      <option value={chapterSlug || ''}>
                        Chapter {chapterSlug?.match(/\d+/)?.[0] || 'Current'}
                      </option>
                      {/* Additional chapters would be populated here */}
                    </select>
                    <i className="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>

                  <button
                    onClick={() => handleNavigation('next')}
                    disabled={!chapter.navigation.next}
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      chapter.navigation.next
                        ? 'bg-amber-500 text-black hover:bg-amber-600'
                        : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadChapter}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
                  >
                    <i className="fas fa-download"></i>
                  </button>

                  <button
                    onClick={() => setShowControls(false)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
                  >
                    <i className="fas fa-eye-slash"></i>
                  </button>

                  <button
                    onClick={goToComic}
                    className="p-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 transition"
                  >
                    <i className="fas fa-book mr-2"></i>
                    Detail Komik
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Area */}
      <div
        ref={containerRef}
        className={`pt-20 pb-24 ${
          readMode === 'vertical' 
            ? 'overflow-y-auto h-screen' 
            : 'overflow-x-auto whitespace-nowrap h-screen'
        }`}
      >
        {readMode === 'vertical' ? (
          // Vertical Scroll Mode
          <div className="flex flex-col items-center">
            {chapter.images.map((imageUrl, index) => (
              <div 
                key={index}
                className="relative w-full max-w-4xl mb-2"
              >
                {/* Loading Skeleton */}
                {!loadingStates[index] && (
                  <div className="absolute inset-0 bg-zinc-900 animate-pulse rounded-lg"></div>
                )}

                {/* Page Number */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                    {index + 1}
                  </span>
                </div>

                {/* Image */}
                <img
                  src={getImageUrl(imageUrl)}
                  alt={`Page ${index + 1}`}
                  className={`w-full h-auto object-contain ${
                    loadingStates[index] ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`}
                  onLoad={() => handleImageLoad(index)}
                  loading="lazy"
                />

                {/* Page Info */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="glass px-4 py-2 rounded-xl text-sm">
                    Page {index + 1} of {totalPages}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Horizontal Mode
          <div className="flex h-full">
            {chapter.images.map((imageUrl, index) => (
              <div 
                key={index}
                className="relative h-full inline-flex items-center justify-center"
                style={{ width: '100vw' }}
              >
                {/* Loading Skeleton */}
                {!loadingStates[index] && (
                  <div className="absolute inset-0 bg-zinc-900 animate-pulse"></div>
                )}

                {/* Page Number */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                    {index + 1} / {totalPages}
                  </span>
                </div>

                {/* Image */}
                <img
                  src={getImageUrl(imageUrl)}
                  alt={`Page ${index + 1}`}
                  className={`max-h-full max-w-full object-contain ${
                    loadingStates[index] ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`}
                  onLoad={() => handleImageLoad(index)}
                />

                {/* Navigation Hints */}
                {index > 0 && (
                  <button
                    onClick={() => handleNavigation('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 glass rounded-full opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-chevron-left text-2xl"></i>
                  </button>
                )}
                {index < totalPages - 1 && (
                  <button
                    onClick={() => handleNavigation('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 glass rounded-full opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-chevron-right text-2xl"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation (Visible when controls hidden) */}
      {!showControls && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={!chapter.navigation.prev}
              className={`p-3 rounded-full ${
                chapter.navigation.prev
                  ? 'glass hover:bg-white/20'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-chevron-up"></i>
            </button>
            <button
              onClick={resetControlsTimer}
              className="p-3 glass rounded-full hover:bg-white/20"
            >
              <i className="fas fa-bars"></i>
            </button>
            <button
              onClick={() => handleNavigation('next')}
              disabled={!chapter.navigation.next}
              className={`p-3 rounded-full ${
                chapter.navigation.next
                  ? 'glass hover:bg-white/20'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-4 z-40"
          >
            <div className="glass p-4 rounded-xl text-sm max-w-xs">
              <h3 className="font-bold mb-2">Keyboard Shortcuts</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span>← → / A D</span>
                  <span className="text-gray-400">Navigate</span>
                </li>
                <li className="flex justify-between">
                  <span>Space / F</span>
                  <span className="text-gray-400">Fullscreen</span>
                </li>
                <li className="flex justify-between">
                  <span>ESC</span>
                  <span className="text-gray-400">Exit</span>
                </li>
                <li className="flex justify-between">
                  <span>1 2 3</span>
                  <span className="text-gray-400">Quality</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Page Indicator (Always visible) */}
      <div className="fixed bottom-24 right-4 z-40">
        <div className="glass px-4 py-2 rounded-xl">
          <span className="font-bold">{currentPage + 1}</span>
          <span className="text-gray-400"> / {totalPages}</span>
        </div>
      </div>
    </div>
  )
}

export default Chapter
