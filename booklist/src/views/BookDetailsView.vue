<template>
  <div class="book-details-view">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="book-content">
      <div class="book-header">
        <img :src="book.thumbnail_url" :alt="book.title" class="book-cover" />
        <div class="book-info">
          <h1>{{ book.title }}</h1>
          <p class="authors">{{ book.authors?.join(', ') }}</p>
          <div class="stats">
            <div class="stat">
              <span class="stat-number">{{ book.reader_count }}</span>
              <span class="stat-label">Readers</span>
            </div>
          </div>
          <div v-if="isAuthenticated" class="actions">
            <button v-if="!userStatus" @click="addToLibrary" class="add-button">
              Add to Library
            </button>
            <div v-else class="status-selector">
              <select v-model="userStatus" @change="updateStatus">
                <option value="Currently Reading">Currently Reading</option>
                <option value="Have Read">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isAuthenticated && userStatus" class="user-book-status">
        <div class="status-header">
          <h2>Your Book Status</h2>
          <button @click="removeFromLibrary" class="remove-button" title="Remove from Library">
            Remove from Library
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user } from '../firebase'
import { fetchApi } from '@/config/api'

const route = useRoute()
const router = useRouter()
const book = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const userStatus = ref<string | null>(null)
const currentUsername = ref<string>('')
const isAuthenticated = computed(() => !!user.value)

const fetchCurrentUsername = async () => {
  if (user.value) {
    const idToken = await user.value.getIdToken()
    const response = await fetchApi('/user', {
      headers: {
        Authorization: idToken
      }
    })
    const userData = await response.json()
    currentUsername.value = userData.username
  }
}

const fetchBookDetails = async () => {
  try {
    const response = await fetchApi(`/books/details/${route.params.bookId}`)
    if (!response.ok) throw new Error('Failed to fetch book details')
    const data = await response.json()
    book.value = data
    if (user.value) {
      const reader = data.readers.find((r: any) => r.username === currentUsername.value)
      userStatus.value = reader?.status || null
    }
  } catch (err) {
    error.value = 'Error loading book details'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const addToLibrary = async () => {
  try {
    if (!user.value) return
    const idToken = await user.value.getIdToken()
    await fetchApi('/books', {
      method: 'POST',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: book.value.google_books_id,
        title: book.value.title,
        authors: book.value.authors,
        imageLinks: {
          thumbnail: book.value.thumbnail_url
        },
        status: 'Currently Reading'
      })
    })
    userStatus.value = 'Currently Reading'
    await fetchBookDetails()
  } catch (err) {
    console.error('Error adding book:', err)
  }
}

const updateStatus = async () => {
  try {
    if (!user.value || !userStatus.value) return
    const idToken = await user.value.getIdToken()
    await fetchApi(`/books/${book.value.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: userStatus.value
      })
    })
    await fetchBookDetails()
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

const removeFromLibrary = async () => {
  if (!confirm('Are you sure you want to remove this book from your library?')) return
  try {
    if (!user.value) return
    const idToken = await user.value.getIdToken()
    await fetchApi(`/books/${book.value.id}/library`, {
      method: 'DELETE',
      headers: {
        Authorization: idToken
      }
    })
    userStatus.value = null
    await fetchBookDetails()
  } catch (err) {
    console.error('Error removing book:', err)
  }
}

onMounted(async () => {
  await fetchCurrentUsername()
  await fetchBookDetails()
})
</script>

<style scoped>
.book-details-view {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.book-header {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.book-cover {
  width: 300px;
  height: 450px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.book-info {
  flex: 1;
}

.book-info h1 {
  margin: 0 0 16px;
  color: var(--color-heading);
  font-size: 2.5em;
}

.authors {
  color: var(--color-text-soft);
  font-size: 1.2em;
  margin-bottom: 24px;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--color-heading);
}

.stat-label {
  color: var(--color-text-soft);
}

.actions {
  margin-top: 24px;
}

.add-button {
  padding: 12px 24px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  transition: transform 0.2s ease;
}

.add-button:hover {
  transform: translateY(-2px);
}

.status-selector select {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  font-size: 1em;
  width: 200px;
}

.readers-section {
  margin-top: 40px;
}

.readers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.reader-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-badge.Currently-Reading {
  background: var(--color-accent);
  color: white;
}

.status-badge.Have-Read {
  background: var(--color-success);
  color: white;
}

.user-book-status {
  margin-top: 40px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background-color: var(--color-background-soft);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h2 {
  margin: 0;
  color: var(--color-heading);
}

.remove-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 24px; /* Make it more rounded */
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.remove-button:hover {
  filter: brightness(110%);
  transform: translateY(-1px);
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  color: var(--color-text-soft);
}

.status-select {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-body);
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-select:hover {
  border-color: var(--color-accent);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--color-text-soft);
}

.error {
  color: var(--color-error);
  text-align: center;
  padding: 20px;
}
</style>
