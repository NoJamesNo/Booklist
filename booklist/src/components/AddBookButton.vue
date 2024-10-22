<template>
  <button @click="$emit('click')" class="add-book-button">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.805 5 19c0-.101.009-.191.024-.273.112-.576.584-.717.988-.727H21V4a2 2 0 0 0-2-2zm0 9-2-1-2 1V4h4v7z"
      />
      <path d="M11 14h2v-3h3V9h-3V6h-2v3H8v2h3z" />
    </svg>
    <span>Add a book</span>
  </button>
</template>

<script setup lang="ts">
defineEmits(['click'])
</script>

<style scoped>
.add-book-button {
  width: 120px;
  height: 180px;
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
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
}

.add-book-button span {
  font-size: 14px;
}
</style>
