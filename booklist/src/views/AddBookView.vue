<template>
  <div class="add-book-page">
    <div class="header">
      <button class="back-button" @click="router.back()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="back-icon"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="page-title">Add a Book</h2>
    </div>
    <div class="layout">
      <div class="search-container">
        <input
          v-model="searchQuery"
          @input="debounceSearch"
          placeholder="Search for a book..."
          class="search-input"
        />
        <div class="search-results">
          <div
            v-for="book in searchResults"
            :key="book.id"
            class="book-item"
            :class="{ selected: selectedBook?.id === book.id }"
            @click="selectBook(book)"
          >
            <img :src="book.imageLinks?.thumbnail" :alt="book.title" class="book-cover" />
            <div class="book-info">
              <h3>{{ book.title }}</h3>
              <p>{{ book.authors?.join(', ') }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedBook" class="book-details">
        <h3>Add to Your Library</h3>
        <div class="selected-book">
          <img
            :src="selectedBook.imageLinks?.thumbnail"
            :alt="selectedBook.title"
            class="detail-cover"
          />
          <div class="detail-info">
            <h4>{{ selectedBook.title }}</h4>
            <p>{{ selectedBook.authors?.join(', ') }}</p>
          </div>
        </div>

        <div class="options">
          <h4>Status</h4>
          <div class="status-options">
            <button
              @click="selectedStatus = 'Currently Reading'"
              :class="{ active: selectedStatus === 'Currently Reading' }"
              class="status-button"
            >
              Currently Reading
            </button>
            <button
              @click="selectedStatus = 'Have Read'"
              :class="{ active: selectedStatus === 'Have Read' }"
              class="status-button"
            >
              Completed
            </button>
          </div>

          <button @click="addBook(selectedBook)" class="add-button" :disabled="!selectedStatus">
            Add to Library
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import { user } from '../firebase'
import { fetchApi } from '@/config/api'

const router = useRouter()
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedBook = ref<any>(null)
const selectedStatus = ref<'Currently Reading' | 'Have Read' | null>(null)

const searchBooks = async () => {
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    return
  }
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery.value)}`
    )
    const data = await response.json()
    searchResults.value = data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      imageLinks: item.volumeInfo.imageLinks
    }))
  } catch (error) {
    console.error('Error searching books:', error)
  }
}

const selectBook = (book: any) => {
  selectedBook.value = book
}

const debounceSearch = debounce(searchBooks, 300)

const addBook = async (book: any) => {
  if (!selectedStatus.value) return

  try {
    if (!user.value) {
      throw new Error('User is not signed in')
    }
    const idToken = await user.value.getIdToken()
    const response = await fetchApi('/books', {
      method: 'POST',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: book.id,
        title: book.title,
        authors: book.authors,
        imageLinks: book.imageLinks,
        status: selectedStatus.value
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to add book: ${response.status}`)
    }

    const userData = await fetchApi('/user', {
      headers: {
        Authorization: idToken
      }
    }).then((res) => res.json())

    router.push(`/${userData.username}`)
  } catch (error) {
    console.error('Error adding book:', error)
  }
}

onUnmounted(() => {
  debounceSearch.cancel()
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--color-background-soft);
  transform: translateX(-2px);
}

.back-icon {
  width: 20px;
  height: 20px;
}
.add-book-page {
  padding: 20px;
  height: calc(100vh - 140px);
  overflow: hidden;
}

.layout {
  display: grid;
  grid-template-columns: 2fr 300px;
  gap: 24px;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.page-title {
  color: var(--color-heading);
}

.search-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 600px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: var(--font-size-body);
}

.search-results {
  flex: 1;
  overflow-y: auto;
  display: grid;
  gap: 16px;
  padding-right: 16px;
}

.book-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  cursor: pointer;
  transition: all 0.2s ease;
}

.book-item:hover {
  background-color: var(--color-background-soft);
}

.book-item.selected {
  border-color: var(--color-accent);
  background-color: var(--color-background-mute);
}

.book-cover {
  width: 80px;
  height: 120px;
  object-fit: cover;
  margin-right: 16px;
  border-radius: 4px;
}

.book-info {
  flex: 1;
}

.book-info h3 {
  margin: 0 0 8px;
  color: var(--color-heading);
}

.book-info p {
  margin: 0;
  color: var(--color-text-soft);
}

.book-details {
  border-left: 1px solid var(--color-border);
  padding-left: 24px;
}

.selected-book {
  margin: 20px 0;
  display: flex;
  gap: 16px;
}

.detail-cover {
  width: 100px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.status-options {
  display: grid;
  gap: 8px;
  margin: 16px 0;
}

.status-button {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-button.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.add-button {
  width: 100%;
  padding: 12px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-button:not(:disabled):hover {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .add-book-page {
    padding: 16px;
    height: auto;
    overflow: visible;
  }

  .layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .search-container {
    min-width: unset;
    height: auto;
    max-height: 50vh;
  }

  .book-details {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-left: 0;
    padding-top: 24px;
  }

  .search-results {
    max-height: 40vh;
    overflow-y: auto;
  }

  .book-item {
    padding: 12px;
  }

  .book-cover {
    width: 60px;
    height: 90px;
  }

  .detail-cover {
    width: 80px;
    height: 120px;
  }

  .status-options {
    grid-template-columns: 1fr;
  }

  .header {
    margin-bottom: 16px;
  }

  .back-button {
    padding: 6px 12px;
  }

  .search-input {
    margin-bottom: 16px;
  }
}
</style>
