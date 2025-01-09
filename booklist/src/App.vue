<script setup lang="ts">
import { onMounted } from 'vue'

import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'

onMounted(async () => {
  try {
    const response = await fetch('/api/test')
    const data = await response.json()
    console.log('Backend test:', data)
  } catch (error) {
    console.error('Backend test failed:', error)
  }
})
</script>

<template>
  <Header />
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <div class="content-container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: calc(100vh - 100px);
  margin-top: 100px;
}

.main-content {
  flex: 1;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  margin: 0 auto;
}
</style>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
  color: var(--color-text);
}
</style>
