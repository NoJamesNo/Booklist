<template>
  <div class="popular-section">
    <div v-if="error" class="text-body">An error occurred: {{ error }}</div>
    <div v-else>
      <div class="section-header">
        <h1 class="text-h2">Popular Books</h1>
      </div>
      <div class="category">
        <div class="book-row">
          <div v-for="book in popularBooks" :key="book.id" class="book-item">
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
              <p class="book-author">
                Added by {{ book.add_count }} {{ book.add_count === 1 ? 'reader' : 'readers' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchApi } from '@/config/api'

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
    const response = await fetchApi('/books/popular')
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
.popular-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  width: 100%;
}

.category {
  width: 100%;
  margin-bottom: var(--section-gap);
}

.book-row {
  display: flex;
  padding: 20px;
  gap: 20px;
  border-radius: 8px;
  max-width: 1200px;
  overflow-x: scroll;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
  padding: 8px;
  border-radius: 8px;
}

.book-item:hover:not(.modal-open) {
  transform: translateY(-4px);
  background-color: var(--color-background-soft);
  filter: brightness(1.1);
}

.book-cover {
  width: 100px;
  height: 150px;
  object-fit: cover;
  margin-bottom: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.book-item:hover:not(.modal-open) .book-cover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.book-info {
  text-align: center;
  width: 100%;
}

.book-title {
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-heading);
  margin: 0;
  line-height: 1.2;
}

.book-author {
  font-family: var(--font-family-base);
  font-size: calc(var(--font-size-body) * 0.9);
  font-weight: var(--font-weight-regular);
  color: var(--color-text);
  margin: 5px 0 0;
  line-height: 1.4;
}

.text-body {
  color: var(--color-text);
  font-size: var(--font-size-body);
  margin: 16px 0;
}

/* Scrollbar styling */
.book-row::-webkit-scrollbar {
  height: 8px;
}

.book-row::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 4px;
}

.book-row::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.book-row::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
</style>
