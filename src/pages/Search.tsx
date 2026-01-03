import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import ComicCard from '../components/ComicCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { api, Comic } from '../utils/api'

const Search: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Comic[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Get initial search from URL
  useEffect(() => {
    const query = searchParams.get('q')
    const genre = searchParams.get('genre')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    
    if (query) setSearchTerm(query)
    if (genre) setSelectedGenre(genre)
    if (type) setSelectedType(type)
    if (status) setSelectedStatus(status)
  }, [searchParams])

  // Initial search
  useEffect(() => {
    if (searchTerm || selectedGenre || selectedType || selectedStatus) {
      handleSearch(true)
    }
  }, [searchTerm, selectedGenre, selectedType, selectedStatus])

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      // This would fetch from API - for now return mock data
      return [
        { slug: 'action', title: 'Action' },
        { slug: 'adventure', title: 'Adventure' },
        { slug: 'comedy', title: 'Comedy' },
        { slug: 'drama', title: 'Drama' },
        { slug: 'fantasy', title: 'Fantasy' },
        { slug: 'horror', title: 'Horror' },
        { slug: 'romance', title: 'Romance' },
        { slug: 'sci-fi', title: 'Sci-Fi' },
        { slug: 'slice-of-life', title: 'Slice of Life' },
        { slug: 'supernatural', title: 'Supernatural' },
      ]
    }
  })

  // Search function
  const handleSearch = async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page
    
    setIsSearching(true)
    try {
      let results
      
      if (selectedGenre) {
        results = await api.genre(selectedGenre, currentPage)
      } else if (searchTerm) {
        results = await api.search(searchTerm, currentPage)
      } else {
        results = await api.list({
          type: selectedType || undefined,
          status: selectedStatus || undefined,
          page: currentPage,
          orderby: 'popular'
        })
      }
      
      if (results?.data) {
        const data = Array.isArray(results.data) ? results.data : [results.data]
        
        if (resetPage) {
          setSearchResults(data)
        } else {
          setSearchResults(prev => [...prev, ...data])
        }
        
        setHasMore(data.length > 0 && data.length === 20) // Assuming 20 per page
        if (resetPage) {
          setPage(2)
        } else {
          setPage(prev => prev + 1)
        }
      } else {
        if (resetPage) setSearchResults([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Gagal mencari')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle comic click
  const handleComicClick = async (comic: Comic) => {
    try {
      const uuid = await api.getUuid(comic.slug, 'series')
      navigate(uuid ? `/series/${uuid}` : `/series/${comic.slug}`)
    } catch (error) {
      console.error('Error navigating:', error)
      navigate(`/series/${comic.slug}`)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGenre('')
    setSelectedType('')
    setSelectedStatus('')
    setSearchResults([])
    setPage(1)
    navigate('/search')
  }

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedGenre) params.set('genre', selectedGenre)
    if (selectedType) params.set('type', selectedType)
    if (selectedStatus) params.set('status', selectedStatus)
    
    navigate(`/search?${params.toString()}`, { replace: true })
  }, [searchTerm, selectedGenre, selectedType, selectedStatus, navigate])

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Cari Komik</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul komik..."
            className="w-full px-6 py-4 bg-zinc-900 border border-white/10 rounded-2xl focus:border-amber-500 focus:outline-none text-lg pr-12"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
          />
          <button
            onClick={() => handleSearch(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400"
          >
            <i className="fas fa-search text-xl"></i>
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="">Semua Genre</option>
                {genresData?.map(genre => (
                  <option key={genre.slug} value={genre.slug}>
                    {genre.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipe</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="">Semua Tipe</option>
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSearch(true)}
              className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 transition"
            >
              <i className="fas fa-search mr-2"></i>
              Cari
            </button>
            
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition"
            >
              <i className="fas fa-times mr-2"></i>
              Hapus Filter
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedGenre || selectedType || selectedStatus || searchTerm) && (
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-2">Filter Aktif</h3>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm">
                    <i className="fas fa-search mr-1"></i>
                    "{searchTerm}"
                  </span>
                )}
                {selectedGenre && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm">
                    <i className="fas fa-tag mr-1"></i>
                    {genresData?.find(g => g.slug === selectedGenre)?.title || selectedGenre}
                  </span>
                )}
                {selectedType && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                    <i className="fas fa-book mr-1"></i>
                    {selectedType}
                  </span>
                )}
                {selectedStatus && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-500 rounded-full text-sm">
                    <i className="fas fa-circle mr-1"></i>
                    {selectedStatus}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="text-red-400 hover:text-red-300"
            >
              <i className="fas fa-times-circle text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {searchResults.length === 0 && !isSearching
              ? 'Hasil Pencarian'
              : `Ditemukan ${searchResults.length} komik`
            }
          </h2>
          
          {searchResults.length > 0 && (
            <div className="flex items-center gap-4">
              <select className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1 text-sm">
                <option>Urutkan: Terpopuler</option>
                <option>Terbaru</option>
                <option>A-Z</option>
              </select>
              <span className="text-sm text-gray-400">
                Halaman {page - 1}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isSearching && page === 1 && (
          <div className="py-20">
            <LoadingSpinner message="Mencari komik..." />
          </div>
        )}

        {/* No Results */}
        {!isSearching && searchResults.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">Tidak ditemukan</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || selectedGenre || selectedType || selectedStatus
                ? 'Tidak ada komik yang cocok dengan filter pencarianmu'
                : 'Gunakan form di atas untuk mencari komik'
              }
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-amber-500 rounded-xl font-bold hover:bg-amber-600 transition"
            >
              {searchTerm || selectedGenre || selectedType || selectedStatus
                ? 'Hapus Filter'
                : 'Cari Komik'
              }
            </button>
          </div>
        )}

        {/* Results Grid */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((comic, index) => (
                  <motion.div
                    key={comic.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ComicCard
                      comic={comic}
                      onClick={() => handleComicClick(comic)}
                      size="medium"
                      showType={true}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center py-8">
                  {isSearching ? (
                    <div className="inline-block">
                      <LoadingSpinner message="Memuat lebih banyak..." />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSearch(false)}
                      className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl font-medium transition"
                    >
                      <i className="fas fa-chevron-down mr-2"></i>
                      Muat Lebih Banyak
                    </button>
                  )}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && searchResults.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-block p-4 bg-zinc-900/50 rounded-2xl">
                    <i className="fas fa-flag-checkered text-amber-500 text-2xl mb-2"></i>
                    <p className="text-gray-400">Semua hasil telah ditampilkan</p>
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Search Tips */}
      <div className="mt-12 p-6 bg-zinc-900/30 rounded-2xl">
        <h3 className="text-lg font-bold mb-4">Tips Pencarian</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 p-4 rounded-xl">
            <div className="text-amber-500 text-2xl mb-2">
              <i className="fas fa-search"></i>
            </div>
            <h4 className="font-bold mb-2">Pencarian Spesifik</h4>
            <p className="text-sm text-gray-400">
              Gunakan kata kunci spesifik untuk hasil yang lebih akurat
            </p>
          </div>
          
          <div className="bg-zinc-900/50 p-4 rounded-xl">
            <div className="text-amber-500 text-2xl mb-2">
              <i className="fas fa-filter"></i>
            </div>
            <h4 className="font-bold mb-2">Filter Lanjutan</h4>
            <p className="text-sm text-gray-400">
              Kombinasikan genre, tipe, dan status untuk pencarian terbaik
            </p>
          </div>
          
          <div className="bg-zinc-900/50 p-4 rounded-xl">
            <div className="text-amber-500 text-2xl mb-2">
              <i className="fas fa-fire"></i>
            </div>
            <h4 className="font-bold mb-2">Trending</h4>
            <p className="text-sm text-gray-400">
              Cek halaman utama untuk komik trending terbaru
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Search
