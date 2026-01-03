// API Configuration
const API_PROXY = import.meta.env.VITE_API_URL || "https://api.nekolabs.web.id/px?url="
const API_BASE = import.meta.env.VITE_KOMIKCAST_URL || "https://www.sankavollerei.com/comic/komikcast"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin + '/api'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  result?: {
    content?: T
    data?: T
  }
  data?: T
  content?: T
}

export interface Comic {
  slug: string
  title: string
  image: string
  type: 'manga' | 'manhwa' | 'manhua' | 'other'
  status: 'ongoing' | 'completed'
  rating: string
  genres: { title: string }[]
  synopsis: string
  chapters: Chapter[]
  latestChapter?: string
}

export interface Chapter {
  slug: string
  title: string
  date?: string
  images: string[]
  navigation: {
    prev: string | null
    next: string | null
  }
}

// Cache system
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const fetchAPI = async <T>(url: string): Promise<T | null> => {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const response = await fetch(API_PROXY + encodeURIComponent(url))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data: ApiResponse<T> = await response.json()
    
    let result: T | null = null
    if (data.success) {
      result = data.result?.content || data.result?.data || data.data || data.content || data as T
    }

    // Cache the result
    if (result) {
      cache.set(url, { data: result, timestamp: Date.now() })
    }

    return result
  } catch (error) {
    console.error('API Error:', error)
    return null
  }
}

// Backend API calls (UUID mapping)
export const backendAPI = {
  getUuid: async (slug: string, type: 'series' | 'chapter'): Promise<string | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/get-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, type })
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.uuid || null
    } catch (error) {
      console.error('Backend UUID Error:', error)
      return null
    }
  },

  getSlug: async (uuid: string): Promise<{ slug: string; type: string } | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/get-slug/${uuid}`)
      
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error('Backend Slug Error:', error)
      return null
    }
  },

  health: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

// Main API functions
export const api = {
  // KomikCast API
  home: () => fetchAPI<{ data: any }>(`${API_BASE}/home`),
  
  detail: (slug: string) => fetchAPI<{ data: Comic }>(`${API_BASE}/detail/${slug}`),
  
  chapter: (slug: string) => fetchAPI<{ data: Chapter }>(`${API_BASE}/chapter/${slug}`),
  
  search: (query: string, page: number = 1) => 
    fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/${page}`),
  
  genre: (slug: string, page: number = 1) => 
    fetchAPI(`${API_BASE}/genre/${slug}/${page}`),
  
  list: (params: { 
    status?: string
    type?: string
    orderby?: string
    page?: number
  }) => {
    const query = new URLSearchParams(params as any).toString()
    return fetchAPI(`${API_BASE}/list?${query}`)
  },

  // Backend API (UUID mapping)
  getUuid: backendAPI.getUuid,
  getSlug: backendAPI.getSlug,
  health: backendAPI.health,

  // Utilities
  clearCache: () => cache.clear(),
  getCacheSize: () => cache.size
  }
