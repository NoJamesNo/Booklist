<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Add a Book</h2>
      <input v-model="searchQuery" @input="debounceSearch" placeholder="Search for a book..." />
      <div class="search-results">
        <div v-for="book in searchResults" :key="book.id" class="book-item">
          <img :src="book.imageLinks?.thumbnail" alt="Book cover" />
          <div>
            <h3>{{ book.title }}</h3>
            <p>{{ book.authors?.join(', ') }}</p>
          </div>
          <button @click="addBook(book)" class="add-book-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.805 5 19c0-.101.009-.191.024-.273.112-.576.584-.717.988-.727H21V4a2 2 0 0 0-2-2zm0 9-2-1-2 1V4h4v7z"
              />
              <path d="M11 14h2v-3h3V9h-3V6h-2v3H8v2h3z" />
            </svg>
            <span>Add</span>
          </button>
        </div>
      </div>
      <button @click="closeModal" class="close-button">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import debounce from 'lodash/debounce'
import { user } from '../firebase'
import { getIdToken } from '../firebase'
import type LoginModalVue from './LoginModal.vue'
import axios from 'axios'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close', 'addBook'])

const searchQuery = ref('')
const searchResults = ref<any[]>([])

const closeModal = () => {
  emit('close')
}

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

const debounceSearch = debounce(searchBooks, 300)

const addBook = async (book: any) => {
  try {
    if (!user.value) {
      throw new Error('User is not signed in')
    }
    const idToken = await user.value.getIdToken()
    console.log('Sending request to add book:', book)

    const response = await fetch('/api/books', {
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
        status: 'Currently Reading'
      })
    })

    const rawResponse = await response.text()
    console.log('Raw server response:', rawResponse)
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers))

    if (!response.ok) {
      throw new Error(`Failed to add book to collection: ${response.status} - ${rawResponse}`)
    }

    let responseData
    try {
      responseData = JSON.parse(rawResponse)
    } catch (e) {
      console.error('Error parsing JSON:', e)
      throw new Error(`Failed to parse server response: ${rawResponse}`)
    }

    console.log('Book added to collection:', responseData)

    emit('addBook', book)
    closeModal()
  } catch (error) {
    console.error('Error adding book to collection:', error)
  }
}

onUnmounted(() => {
  debounceSearch.cancel()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.search-results {
  margin-top: 20px;
}

.book-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.book-item img {
  width: 50px;
  margin-right: 10px;
}

.add-book-button {
  width: 60px;
  height: 90px;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-book-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
}

.add-book-button svg {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

.add-book-button span {
  font-size: 12px;
}

.close-button {
  margin-top: 20px;
}
</style>
