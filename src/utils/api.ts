const API_PROXY = "https://api.nekolabs.web.id/px?url=";
const API_BASE = "https://www.sankavollerei.com/comic/komikcast";

export const fetchAPI = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(API_PROXY + encodeURIComponent(url));
    const data = await response.json();
    
    if (data.success) {
      return data.result?.content || data.result || data;
    }
    return null;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const api = {
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
};
