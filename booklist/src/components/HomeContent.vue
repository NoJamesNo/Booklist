<template>
  <div class="popular-books">
    <h1 class="text-h2">Popular Books</h1>
    <div v-if="isLoading" class="loading">Loading popular books...</div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="books-grid">
      <div v-for="book in popularBooks" :key="book.id" class="book-card">
        <img
          :src="book.thumbnail_url"
          :alt="book.title"
          class="book-cover"
          @error="handleImageError"
        />
        <div class="book-info">
          <h3 class="book-title">{{ book.title }}</h3>
          <p class="book-author">
            {{ book.authors ? book.authors.join(', ') : 'Unknown Author' }}
          </p>
          <p class="book-popularity">
            Added by {{ book.add_count }} {{ book.add_count === 1 ? 'reader' : 'readers' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Book {
  id: string
  google_books_id: string
  title: string
  authors?: string[]
  thumbnail_url?: string
  add_count: number
}

const popularBooks = ref<Book[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const fetchPopularBooks = async () => {
  try {
    const response = await fetch('/api/books/popular')
    if (!response.ok) {
      throw new Error('Failed to fetch popular books')
    }
    const data = await response.json()
    popularBooks.value = data.books
  } catch (err) {
    error.value = 'Error loading popular books'
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-book-cover.png' // Replace with your placeholder image
}

onMounted(() => {
  fetchPopularBooks()
})
</script>

<style scoped>
.popular-books {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: var(--font-size-xl);
  color: var(--color-heading);
  margin-bottom: 2rem;
  text-align: center;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.book-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: var(--color-background-soft);
  transition: transform 0.2s ease;
}

.book-card:hover {
  transform: translateY(-4px);
}

.book-cover {
  width: 140px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.book-info {
  text-align: center;
  width: 100%;
}

.book-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-heading);
  margin: 0.5rem 0;
  line-height: 1.2;
}

.book-author {
  font-size: var(--font-size-small);
  color: var(--color-text);
  margin: 0.25rem 0;
}

.book-popularity {
  font-size: var(--font-size-small);
  color: var(--color-text-soft);
  margin: 0.5rem 0;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .book-cover {
    width: 120px;
    height: 180px;
  }
}
</style>
