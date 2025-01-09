<template>
  <div class="book-collection">
    <div v-if="error" class="text-body">An error occurred: {{ error }}</div>
    <div v-if="isLoading" class="text-body">Loading...</div>
    <div v-else>
      <div class="user-header">
        <h1 class="text-h2">{{ username }}</h1>
      </div>

      <BookSection
        :username="username"
        :isOwner="isOwner"
        @openModal="openModal"
        :key="refreshKey"
        @bookUpdated="refreshBooks"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BookSection from '@/components/BookSection.vue'
import { fetchApi } from '@/config/api'

const route = useRoute()
const username = computed(() => route.params.username as string)
const currentUsername = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const isModalOpen = ref(false)
const refreshKey = ref(0)

const isOwner = computed(() => {
  return currentUsername.value === username.value
})

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const addBook = async (book: any) => {
  refreshBooks()
  closeModal()
}

const refreshBooks = () => {
  refreshKey.value++
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken()
      try {
        const response = await fetchApi('/user', {
          headers: {
            Authorization: idToken
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        currentUsername.value = userData.username
      } catch (err) {
        console.error('Error fetching user data:', err)
        error.value = 'Failed to load user data'
      }
    }
    isLoading.value = false
  })
})
</script>

<style scoped>
.book-collection {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  width: 100%;
}

.text-h1 {
  margin: 0;
  color: var(--color-heading);
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
}

.owner-badge {
  background-color: var(--color-background-soft);
  color: var(--color-text-soft);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
}

.text-body {
  color: var(--color-text);
  font-size: var(--font-size-body);
  margin: 16px 0;
}
</style>
