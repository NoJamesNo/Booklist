export interface Book {
  id: string
  title: string
  authors?: string[]
  thumbnail_url?: string
  status: 'Currently Reading' | 'Have Read'
}
