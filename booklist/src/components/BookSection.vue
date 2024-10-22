<template>
  <div>
    <div v-if="error">An error occurred: {{ error }}</div>
    <div v-else-if="isLoading">Loading...</div>
    <div v-else>
      <div class="category">
        <h2>Currently Reading</h2>
        <div
          class="book-row"
          :class="{ 'drag-over': isDragOverCurrentlyReading }"
          @dragover.prevent="isDragOverCurrentlyReading = true"
          @dragleave="isDragOverCurrentlyReading = false"
          @drop="onDrop($event, 'Currently Reading')"
        >
          <AddBookButton @click="openModal" />
          <div
            v-for="book in currentlyReading"
            :key="book.id"
            class="book-item"
            draggable="true"
            @dragstart="onDragStart($event, book)"
          >
            <img :src="book.thumbnail_url" :alt="book.title" class="book-cover" />
            <div class="book-info">
              <h3>{{ book.title }}</h3>
              <p>{{ book.authors ? book.authors.join(', ') : 'Unknown Author' }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="category">
        <h2>Have Read</h2>
        <div
          class="book-row"
          :class="{ 'drag-over': isDragOverHaveRead }"
          @dragover.prevent="isDragOverHaveRead = true"
          @dragleave="isDragOverHaveRead = false"
          @drop="onDrop($event, 'Have Read')"
        >
          <p v-if="haveRead.length === 0">No books in the 'Have Read' category.</p>
          <div
            v-for="book in haveRead"
            :key="book.id"
            class="book-item"
            draggable="true"
            @dragstart="onDragStart($event, book)"
          >
            <img :src="book.thumbnail_url" :alt="book.title" class="book-cover" />
            <div class="book-info">
              <h3>{{ book.title }}</h3>
              <p>{{ book.authors ? book.authors.join(', ') : 'Unknown Author' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onErrorCaptured } from 'vue'
import AddBookButton from '@/components/AddBookButton.vue'
import { onAuthStateChanged, getAuth } from 'firebase/auth'

interface Book {
  id: string
  title: string
  authors?: string[]
  thumbnail_url?: string
  status: 'Currently Reading' | 'Have Read'
}

const currentlyReading = ref<Book[]>([])
const haveRead = ref<Book[]>([])
const isLoading = ref(true)
const user = ref(null)
const error = ref(null)
const isDragOverCurrentlyReading = ref(false)
const isDragOverHaveRead = ref(false)

const fetchBooks = async () => {
  if (!user.value) {
    console.error('User not logged in')
    isLoading.value = false
    return
  }

  try {
    const idToken = await user.value.getIdToken()
    const response = await fetch('/api/books', {
      headers: {
        Authorization: idToken
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    currentlyReading.value = data.books.filter((book: Book) => book.status === 'Currently Reading')
    haveRead.value = data.books.filter((book: Book) => book.status === 'Have Read')
  } catch (err) {
    console.error('Error fetching books:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    isLoading.value = false
  }
}

const updateBookStatus = async (bookId: string, newStatus: 'Currently Reading' | 'Have Read') => {
  if (!user.value) {
    console.error('User not logged in')
    return
  }

  try {
    const idToken = await user.value.getIdToken()
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

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
  } catch (err) {
    console.error('Error updating book status:', err)
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  }
}

const onDragStart = (event: DragEvent, book: Book) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', book.id)
  }
}

const onDrop = async (event: DragEvent, newStatus: 'Currently Reading' | 'Have Read') => {
  event.preventDefault()
  const bookId = event.dataTransfer?.getData('text/plain')
  if (bookId) {
    await updateBookStatus(bookId, newStatus)
  }
  isDragOverCurrentlyReading.value = false
  isDragOverHaveRead.value = false
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      fetchBooks()
    } else {
      currentlyReading.value = []
      haveRead.value = []
      isLoading.value = false
    }
  })
})

watch(user, (newUser) => {
  if (newUser) {
    fetchBooks()
  }
})

const openModal = () => {
  emit('openModal')
}

const emit = defineEmits(['openModal'])

onErrorCaptured((err) => {
  console.error('Error captured in BookSection:', err)
  error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  return false
})
</script>

<style scoped>
.category {
  width: 100%;
  margin-bottom: 30px;
}

h2 {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.book-row {
  display: flex;
  overflow-x: auto;
  padding: 10px 0;
  gap: 20px;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
}

.book-cover {
  width: 100px;
  height: 150px;
  object-fit: cover;
  margin-bottom: 10px;
}

.book-info {
  text-align: center;
}

.book-info h3 {
  font-size: 0.9em;
  margin: 0;
}

.book-info p {
  font-size: 0.8em;
  margin: 5px 0 0;
}

.book-row.drag-over {
  background-color: #f0f0f0;
  border: 2px dashed #999;
}
</style>
