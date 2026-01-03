import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import ComicCard from '../components/ComicCard'
import ChapterList from '../components/ChapterList'
import LoadingSpinner from '../components/LoadingSpinner'
import { api, Comic, Chapter } from '../utils/api'
import { storage } from '../utils/storage'

const Detail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  
  const [comicSlug, setComicSlug] = useState<string | null>(null)
  const [comic, setComic] = useState<Comic | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [readingProgress, setReadingProgress] = useState<number>(0)
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [similarComics, setSimilarComics] = useState<Comic[]>([])

  // Convert UUID to slug
  useEffect(() => {
    const fetchSlug = async () => {
      if (!uuid) {
        toast.error('UUID tidak valid')
        navigate('/')
        return
      }

      try {
        const slugData = await api.getSlug(uuid)
        if (slugData) {
          setComicSlug(slugData.slug)
        } else {
          // If no UUID mapping, assume param is slug
          setComicSlug(uuid)
        }
      } catch (error) {
        console.error('Error fetching slug:', error)
        setComicSlug(uuid)
      }
    }

    fetchSlug()
  }, [uuid, navigate])

  // Fetch comic details
  useEffect(() => {
    const fetchComic = async () => {
      if (!comicSlug) return

      setIsLoading(true)
      try {
        const data = await api.detail(comicSlug)
        if (data?.data) {
          setComic(data.data)
          setChapters(data.data.chapters || [])
          
          // Check bookmark status
          setIsBookmarked(storage.isBookmarked(data.data.slug))
          
          // Get reading progress
          const progress = storage.getProgress(data.data.slug)
          setReadingProgress(progress?.progress || 0)
          setLastReadChapter(progress?.chapterSlug || null)
          
          // Fetch similar comics (based on first genre)
          if (data.data.genres?.length > 0) {
            fetchSimilarComics(data.data.genres[0].title)
          }
        } else {
          toast.error('Komik tidak ditemukan')
          navigate('/')
        }
      } catch (error) {
        toast.error('Gagal memuat detail komik')
        console.error('Error fetching comic:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComic()
  }, [comicSlug, navigate])

  // Fetch similar comics
  const fetchSimilarComics = async (genre: string) => {
    try {
      const data = await api.search(genre)
      if (data?.data) {
        const filtered = Array.isArray(data.data) 
          ? data.data.filter((c: Comic) => c.slug !== comicSlug).slice(0, 6)
          : []
        setSimilarComics(filtered)
      }
    } catch (error) {
      console.error('Error fetching similar comics:', error)
    }
  }

  // Toggle bookmark
  const handleToggleBookmark = () => {
    if (!comic) return

    const added = storage.toggleBookmark(comic)
    setIsBookmarked(added)
    toast.success(added ? 'Ditambahkan ke bookmark' : 'Dihapus dari bookmark')
  }

  // Handle read chapter
  const handleReadChapter = async (chapterSlug: string, chapterTitle: string) => {
    if (!comic) return

    try {
      const chapterUuid = await api.getUuid(chapterSlug, 'chapter')
      if (chapterUuid) {
        // Save reading progress
        storage.saveProgress(
          comic.slug,
          chapterSlug,
          chapterTitle,
          0, // Start from 0%
          chapters.length
        )
        
        // Add to history
        storage.addHistory(comic, { slug: chapterSlug, title: chapterTitle }, 0)
        
        navigate(`/chapter/${chapterUuid}`)
      } else {
        // Fallback using slug
        navigate(`/chapter/${chapterSlug}`)
      }
    } catch (error) {
      console.error('Error getting chapter UUID:', error)
      navigate(`/chapter/${chapterSlug}`)
    }
  }

  // Handle continue reading
  const handleContinueReading = async () => {
    if (!comic || !lastReadChapter) {
      // Start from first chapter
      const lastChapter = chapters[chapters.length - 1] // Oldest first
      if (lastChapter) {
        handleReadChapter(lastChapter.slug, lastChapter.title)
      }
      return
    }

    // Continue from last read chapter
    const chapter = chapters.find(c => c.slug === lastReadChapter)
    if (chapter) {
      handleReadChapter(chapter.slug, chapter.title)
    }
  }

  // Handle read from start
  const handleReadFromStart = () => {
    if (!comic || chapters.length === 0) return
    
    const firstChapter = chapters[chapters.length - 1] // Oldest is first
    handleReadChapter(firstChapter.slug, firstChapter.title)
  }

  // Share comic
  const handleShare = async () => {
    if (!comic) return

    const shareData = {
      title: comic.title,
      text: `Baca ${comic.title} di FmcComic`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link disalin ke clipboard!')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!comic) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold mb-4">Komik tidak ditemukan</h1>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
        >
          Kembali ke Beranda
        </button>
      </div>
    )
  }

  const totalChapters = chapters.length
  const readPercentage = readingProgress

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-400 mb-6">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-amber-500 transition"
          >
            <i className="fas fa-home mr-2"></i>
            Beranda
          </button>
          <span className="mx-2">/</span>
          <span className="text-amber-500 font-medium">{comic.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cover & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Cover Image */}
              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-30"></div>
                <img
                  src={comic.image}
                  alt={comic.title}
                  className="relative w-full rounded-2xl shadow-2xl"
                />
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    comic.type === 'manga' ? 'bg-blue-600' :
                    comic.type === 'manhwa' ? 'bg-green-600' :
                    comic.type === 'manhua' ? 'bg-red-600' :
                    'bg-gray-600'
                  }`}>
                    {comic.type}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    comic.status === 'Ongoing' 
                      ? 'bg-green-600 text-green-100' 
                      : 'bg-blue-600 text-blue-100'
                  }`}>
                    {comic.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleContinueReading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
                >
                  <i className="fas fa-play"></i>
                  {lastReadChapter ? 'Lanjut Membaca' : 'Baca Sekarang'}
                </button>

                <button
                  onClick={handleReadFromStart}
                  className="w-full py-4 bg-zinc-900/80 border border-white/10 rounded-2xl font-bold hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
                >
                  Baca dari Awal
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleBookmark}
                    className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                      isBookmarked
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : 'bg-zinc-900/80 border border-white/10 hover:border-amber-500/50'
                    }`}
                  >
                    <i className={`fas ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark'}`}></i>
                    {isBookmarked ? 'Tersimpan' : 'Simpan'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-3 bg-zinc-900/80 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
                  >
                    <i className="fas fa-share-alt"></i>
                    Bagikan
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-zinc-900/50 rounded-2xl p-6 mb-8">
                <h3 className="font-bold mb-4 text-lg">Informasi</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${
                      comic.status === 'Ongoing' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {comic.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating</span>
                    <span className="font-medium text-amber-500">
                      ⭐ {comic.rating || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Chapter</span>
                    <span className="font-medium">{totalChapters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Progress Baca</span>
                    <span className="font-medium">
                      {readPercentage > 0 ? `${readPercentage}%` : 'Belum mulai'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reading Progress */}
              {readPercentage > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress Membaca</span>
                    <span className="font-medium">{readPercentage}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${readPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details & Chapters */}
          <div className="lg:col-span-2">
            {/* Title & Genres */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{comic.title}</h1>
              
              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {comic.genres?.map((genre, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/search?genre=${genre.title.toLowerCase()}`)}
                    className="px-3 py-1 bg-zinc-900/80 border border-white/10 rounded-full text-sm hover:bg-amber-500/20 hover:border-amber-500/50 transition"
                  >
                    {genre.title}
                  </button>
                ))}
              </div>

              {/* Synopsis */}
              <div className="bg-zinc-900/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Sinopsis</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {comic.synopsis || 'Sinopsis tidak tersedia.'}
                </p>
              </div>
            </div>

            {/* Chapter List */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Daftar Chapter</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {totalChapters} Chapter
                  </span>
                  <button 
                    onClick={() => {
                      if (totalChapters > 0) {
                        handleReadFromStart()
                      }
                    }}
                    className="px-4 py-2 bg-amber-500/20 text-amber-500 text-sm rounded-xl hover:bg-amber-500/30 transition"
                  >
                    Baca Semua
                  </button>
                </div>
              </div>

              {totalChapters === 0 ? (
                <div className="text-center py-12 bg-zinc-900/30 rounded-2xl">
                  <div className="text-5xl mb-4">📄</div>
                  <h3 className="text-xl font-bold mb-2">Belum ada chapter</h3>
                  <p className="text-gray-400">Chapter akan segera tersedia</p>
                </div>
              ) : (
                <ChapterList
                  chapters={chapters}
                  onChapterClick={handleReadChapter}
                  comicSlug={comic.slug}
                  lastReadChapter={lastReadChapter}
                />
              )}
            </div>

            {/* Similar Comics */}
            {similarComics.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Komik Serupa</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {similarComics.map((similarComic, index) => (
                    <ComicCard
                      key={index}
                      comic={similarComic}
                      onClick={() => {
                        const handleClick = async () => {
                          const uuid = await api.getUuid(similarComic.slug, 'series')
                          navigate(uuid ? `/series/${uuid}` : `/series/${similarComic.slug}`)
                        }
                        handleClick()
                      }}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Report/Info */}
            <div className="bg-zinc-900/30 rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="text-amber-500 text-2xl">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Informasi</h3>
                  <p className="text-sm text-gray-400">
                    Semua konten disediakan oleh KomikCast. Jika ada masalah dengan komik ini, 
                    silakan hubungi sumber aslinya. Website ini hanya sebagai pembaca.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Detail
