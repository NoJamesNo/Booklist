const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '/api'

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`
  console.log('Request URL:', url)
  console.log('Request headers:', options.headers)

  const finalOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  console.log('Final headers:', finalOptions.headers)
  return fetch(url, finalOptions)
}
