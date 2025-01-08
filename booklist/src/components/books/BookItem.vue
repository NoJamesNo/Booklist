<template>
  <router-link
    :to="`/books/${book.id}`"
    class="book-item"
    :draggable="draggable"
    @dragstart="onDragStart"
  >
    <div class="book-item" :draggable="draggable" @dragstart="onDragStart">
      <img :src="book.thumbnail_url" :alt="book.title" class="book-cover" />
      <div class="book-info">
        <h3 class="book-title">{{ book.title }}</h3>
        <p class="book-author">
          {{ book.authors ? book.authors.join(', ') : 'Unknown Author' }}
        </p>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
interface Book {
  id: string
  title: string
  authors?: string[]
  thumbnail_url?: string
  status: 'Currently Reading' | 'Have Read'
}

const props = defineProps<{
  book: Book
  draggable: boolean
}>()

const onDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', props.book.id)
  }
}
</script>

<style scoped>
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
</style>
