<template>
  <div class="book-list">
    <p v-if="books.length === 0">No books added yet.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const books = ref([])
</script>

<style scoped>
.book-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;
  align-content: start;
}
</style>
