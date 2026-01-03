import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import ComicCard from '../components/ComicCard'
import HeroSlider from '../components/HeroSlider'
import FilterBar from '../components/FilterBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { api, Comic } from '../utils/api'
import { storage } from '../utils/storage'

interface HomeProps {
  filter?: 'all' | 'ongoing' | 'completed'
}

const Home: React.FC<HomeProps> = ({ filter = 'all' }) => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState(filter)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Comic[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch home data with React Query
  const { 
    data: homeData, 
    isLoading: isLoadingHome,
    error: homeError 
  } = useQuery({
    queryKey: ['home'],
    queryFn: () => api.home(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch filtered data
  const { 
    data: filteredData, 
    isLoading: isLoadingFiltered,
    error: filteredError 
  } = useQuery({
    queryKey: ['comics', activeFilter],
    queryFn: () => {
      if (activeFilter === 'all') return null
      return api.list({ 
        status: activeFilter === 'ongoing' ? 'Ongoing' : 'Completed',
        orderby: 'popular',
        page: 1 
      })
    },
    enabled: activeFilter !== 'all',
  })

  // Get continue reading from progress
  const continueReading = storage.getHistory()
    .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
    .slice(0, 5)

  // Search function
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await api.search(searchQuery)
      if (results?.data) {
        setSearchResults(Array.isArray(results.data) ? results.data : [results.data])
        toast.success(`Ditemukan ${results.data.length} komik`)
      } else {
        setSearchResults([])
        toast.error('Tidak ditemukan komik')
      }
    } catch (error) {
      toast.error('Gagal mencari komik')
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  // Handle comic click
  const handleComicClick = async (comic: Comic) => {
    try {
      const uuid = await api.getUuid(comic.slug, 'series')
      if (uuid) {
        navigate(`/series/${uuid}`)
      } else {
        // Fallback to slug
        navigate(`/series/${comic.slug}`)
      }
    } catch (error) {
      console.error('Error getting UUID:', error)
      navigate(`/series/${comic.slug}`)
    }
  }

  // Handle genre click
  const handleGenreClick = (genreSlug: string) => {
    navigate(`/search?genre=${genreSlug}`)
  }

  if (homeError || filteredError) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Gagal memuat data</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
        >
          Muat Ulang
        </button>
      </div>
    )
  }

  const isLoading = isLoadingHome || (activeFilter !== 'all' && isLoadingFiltered)
  const showSearchResults = searchResults.length > 0
  const showFilteredContent = activeFilter !== 'all' && filteredData?.data
  const showHomeContent = activeFilter === 'all' && homeData?.data

  return (
    <div className="container mx-auto px-4">
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komik..."
            className="w-full px-6 py-4 bg-zinc-900/80 rounded-2xl border border-white/10 focus:border-amber-500 focus:outline-none pr-12"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500"
          >
            <i className="fas fa-search text-xl"></i>
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          )}
        </form>
      </div>

      {/* Hero Section */}
      <AnimatePresence>
        {!showSearchResults && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-12"
          >
            <HeroSlider 
              comics={homeData?.data?.hotUpdates?.slice(0, 5) || []}
              onComicClick={handleComicClick}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Continue Reading */}
      {continueReading.length > 0 && !showSearchResults && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-amber-500">
                <i className="fas fa-play-circle"></i>
              </span>
              Lanjut Membaca
            </h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-sm text-gray-400 hover:text-amber-500 transition"
            >
              Lihat Semua
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {continueReading.map((item, index) => {
              const progress = storage.getProgress(item.comic.slug)
              return (
                <ComicCard
                  key={index}
                  comic={item.comic}
                  onClick={() => handleComicClick(item.comic)}
                  showProgress={true}
                  progress={progress?.progress || 0}
                  size="medium"
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="mb-8">
        <FilterBar 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Hasil Pencarian: "{searchQuery}"
              </h2>
              <span className="text-sm text-gray-400">
                {searchResults.length} hasil
              </span>
            </div>
            {isSearching ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((comic, index) => (
                  <ComicCard
                    key={index}
                    comic={comic}
                    onClick={() => handleComicClick(comic)}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && !showSearchResults && <LoadingSpinner />}

      {/* Home Content */}
      <AnimatePresence>
        {showHomeContent && !showSearchResults && (
          <>
            {/* Latest Releases */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-amber-500">
                  <i className="fas fa-bolt"></i>
                </span>
                Terbaru Update
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {homeData.data.latestReleases?.slice(0, 15).map((comic: Comic, index: number) => (
                  <ComicCard
                    key={index}
                    comic={comic}
                    onClick={() => handleComicClick(comic)}
                    size="medium"
                    showType={true}
                  />
                ))}
              </div>
            </section>

            {/* Popular Genres */}
            {homeData.data.genres && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="text-amber-500">
                    <i className="fas fa-tags"></i>
                  </span>
                  Genre Populer
                </h2>
                <div className="flex flex-wrap gap-3">
                  {homeData.data.genres.slice(0, 12).map((genre: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleGenreClick(genre.slug)}
                      className="px-4 py-2 bg-zinc-900/50 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/50 rounded-xl transition-all hover:scale-105"
                    >
                      <span className="text-sm font-medium">{genre.title}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Project Updates */}
            {homeData.data.projectUpdates && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="text-amber-500">
                    <i className="fas fa-star"></i>
                  </span>
                  Proyek Unggulan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {homeData.data.projectUpdates.slice(0, 6).map((comic: Comic, index: number) => (
                    <div 
                      key={index}
                      onClick={() => handleComicClick(comic)}
                      className="group bg-zinc-900/50 border border-white/10 rounded-2xl p-4 hover:border-amber-500/50 hover:bg-zinc-800/50 cursor-pointer transition-all"
                    >
                      <div className="flex gap-4">
                        <img
                          src={comic.image}
                          alt={comic.title}
                          className="w-24 h-32 object-cover rounded-xl group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-amber-500 transition">
                            {comic.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {comic.synopsis || 'Deskripsi tidak tersedia'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-500 text-xs rounded">
                              {comic.type}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              comic.status === 'Ongoing' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {comic.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Filtered Content */}
      <AnimatePresence>
        {showFilteredContent && !showSearchResults && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {activeFilter === 'ongoing' ? 'Komik Ongoing' : 'Komik Selesai'}
              </h2>
              <span className="text-sm text-gray-400">
                {filteredData.data.length} komik
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredData.data.map((comic: Comic, index: number) => (
                <ComicCard
                  key={index}
                  comic={comic}
                  onClick={() => handleComicClick(comic)}
                  size="medium"
                  showType={true}
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && !showHomeContent && !showFilteredContent && !showSearchResults && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">Tidak ada komik</h3>
          <p className="text-gray-400 mb-6">Silakan coba filter lain atau muat ulang halaman</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
          >
            Muat Ulang
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
