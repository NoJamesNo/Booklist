const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '/api'

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`
  console.log('Making request to:', url)
  console.log('With headers:', options.headers)

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}
