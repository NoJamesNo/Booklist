const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '/api'

export const fetchApi = (endpoint: string, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  console.log('Fetching from:', url)
  return fetch(url, options)
}
