const API_PROXY = "https://api.nekolabs.web.id/px?url=";
const API_BASE = "https://www.sankavollerei.com/comic/komikcast";

// Get backend URL from environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

export interface ApiResponse<T = any> {
  success: boolean;
  result?: T;
  content?: T;
  data?: T;
}

export const fetchAPI = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(API_PROXY + encodeURIComponent(url));
    const data: ApiResponse<T> = await response.json();
    
    if (data.success) {
      return data.result?.content || data.result || data.data || data;
    }
    return null;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// Backend API calls (untuk UUID mapping)
export const fetchBackend = async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend API Error:', error);
    return null;
  }
};

export const getUuidFromSlug = async (slug: string, type: 'series' | 'chapter'): Promise<string | null> => {
  try {
    const data = await fetchBackend<{ uuid: string }>('/api/get-id', {
      method: 'POST',
      body: JSON.stringify({ slug, type }),
    });
    
    return data?.uuid || null;
  } catch (error) {
    console.error('Error getting UUID:', error);
    return slug; // Fallback ke slug asli
  }
};

export const getSlugFromUuid = async (uuid: string): Promise<{ slug: string; type: string } | null> => {
  try {
    return await fetchBackend(`/api/get-slug/${uuid}`);
  } catch (error) {
    console.error('Error getting slug from UUID:', error);
    return null;
  }
};

// Main API functions
export const api = {
  // KomikCast API
  home: () => fetchAPI(`${API_BASE}/home`),
  detail: (slug: string) => fetchAPI(`${API_BASE}/detail/${slug}`),
  chapter: (slug: string) => fetchAPI(`${API_BASE}/chapter/${slug}`),
  search: (query: string, page: number = 1) => 
    fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/${page}`),
  genre: (slug: string, page: number = 1) => 
    fetchAPI(`${API_BASE}/genre/${slug}/${page}`),
  list: (params: { 
    status?: string; 
    type?: string; 
    orderby?: string; 
    page?: number 
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`${API_BASE}/list?${query}`);
  },
  
  // Backend API (UUID mapping)
  getId: (slug: string, type: 'series' | 'chapter') => getUuidFromSlug(slug, type),
  getSlug: (uuid: string) => getSlugFromUuid(uuid),
};
