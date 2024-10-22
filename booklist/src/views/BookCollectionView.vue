<template>
  <div class="book-collection">
    <h1>My Book Collection</h1>
    <BookSection @openModal="openModal" />
    <BookList />
    <AddBookModal :isOpen="isModalOpen" @close="closeModal" @addBook="addBook" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BookList from '@/components/BookList.vue'
import BookSection from '@/components/BookSection.vue'
import AddBookModal from '@/components/AddBookModal.vue'

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const addBook = (book: any) => {
  // refresh the BookSection component here
  closeModal()
}
</script>

<style scoped>
.book-collection {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
</style>
