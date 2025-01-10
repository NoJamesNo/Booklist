<template>
  <div>
    <div v-if="error" class="text-body">An error occurred: {{ error }}</div>
    <div v-if="isLoading" class="text-body">Loading...</div>
    <div v-else>
      <div class="category">
        <h2 class="text-h2">Currently Reading</h2>
        <div
          class="book-row"
          :class="{ 'drag-over': isDragOverCurrentlyReading, readonly: !isOwner }"
          @dragover.prevent="handleDragOver('Currently Reading')"
          @dragleave="isDragOverCurrentlyReading = false"
          @drop="onDrop($event, 'Currently Reading')"
        >
          <router-link v-if="isOwner" to="/add-book" class="add-book-link">
            <AddBookButton />
          </router-link>
          <BookItem
            v-for="book in currentlyReading"
            :key="book.id"
            :book="book"
            :draggable="isOwner"
          />
        </div>
      </div>
      <div class="category">
        <h2 class="text-h2">Completed</h2>
        <div
          class="book-row"
          :class="{ 'drag-over': isDragOverHaveRead, readonly: !isOwner }"
          @dragover.prevent="handleDragOver('Have Read')"
          @dragleave="isDragOverHaveRead = false"
          @drop="onDrop($event, 'Have Read')"
        >
          <div v-if="haveRead.length === 0" class="empty-message">
            <p class="text-body">No books in the 'Have Read' category.</p>
          </div>
          <BookItem v-for="book in haveRead" :key="book.id" :book="book" :draggable="isOwner" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import AddBookButton from '@/components/books/AddBookButton.vue'
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import BookItem from '@/components/books/BookItem.vue'
import { fetchApi } from '@/config/api'

interface Book {
  id: string
  title: string
  authors?: string[]
  thumbnail_url?: string
  status: 'Currently Reading' | 'Have Read'
}

const props = defineProps<{ username: string }>()
const emit = defineEmits(['openModal', 'bookUpdated'])
const currentlyReading = ref<Book[]>([])
const haveRead = ref<Book[]>([])
const isLoading = ref(true)
const user = ref<any>(null)
const error = ref<string | null>(null)
const isDragOverCurrentlyReading = ref(false)
const isDragOverHaveRead = ref(false)
const currentUsername = ref('')

const isOwner = computed(() => {
  return currentUsername.value === props.username
})

const fetchBooks = async () => {
  console.log('Fetching books for:', props.username)
  try {
    const response = await fetchApi(`/books/user/${props.username}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    console.log('Books data received:', data)
    currentlyReading.value = data.books.filter((book: Book) => book.status === 'Currently Reading')
    haveRead.value = data.books.filter((book: Book) => book.status === 'Have Read')
  } catch (err) {
    console.error('Error fetching books:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleDragOver = (status: string) => {
  if (!isOwner.value) return
  if (status === 'Currently Reading') {
    isDragOverCurrentlyReading.value = true
  } else {
    isDragOverHaveRead.value = true
  }
}

const onDrop = async (event: DragEvent, newStatus: 'Currently Reading' | 'Have Read') => {
  if (!isOwner.value) return
  event.preventDefault()
  const bookId = event.dataTransfer?.getData('text/plain')
  if (bookId) {
    await updateBookStatus(bookId, newStatus)
  }
  isDragOverCurrentlyReading.value = false
  isDragOverHaveRead.value = false
}

const updateBookStatus = async (bookId: string, newStatus: 'Currently Reading' | 'Have Read') => {
  if (!user.value) return
  try {
    const idToken = await user.value.getIdToken()
    console.log('Updating book status, token length:', idToken.length)
    const response = await fetchApi(`/books/${bookId}`, {
      method: 'PATCH',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const book = [...currentlyReading.value, ...haveRead.value].find((b) => b.id === bookId)
    if (book) {
      book.status = newStatus
      currentlyReading.value = currentlyReading.value.filter((b) => b.id !== bookId)
      haveRead.value = haveRead.value.filter((b) => b.id !== bookId)
      if (newStatus === 'Currently Reading') {
        currentlyReading.value.push(book)
      } else {
        haveRead.value.push(book)
      }
    }
    emit('bookUpdated')
  } catch (err) {
    console.error('Error updating book status:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  }
}

const openModal = () => {
  emit('openModal')
}

onMounted(() => {
  console.log('Component mounted')
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user')
    user.value = firebaseUser
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken()
        console.log('Got token, length:', idToken.length)
        const response = await fetch('/api/user', {
          headers: {
            Authorization: idToken
          }
        })
        const userData = await response.json()
        console.log('User data:', userData)
        currentUsername.value = userData.username
      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    }
    fetchBooks()
  })
})

watch(() => props.username, fetchBooks)
</script>

<style scoped>
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

.book-row.drag-over {
  background-color: var(--color-background-mute);
  border: 2px dashed var(--color-border-hover);
}

.readonly {
  pointer-events: none;
  opacity: 0.8;
}

.book-row.readonly {
  border: none;
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

.add-book-link {
  text-decoration: none;
  display: flex;
}
</style>
