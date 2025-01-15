<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import { fetchApi } from './config/api'

onMounted(async () => {
  try {
    const response = await fetchApi('/test')
    const data = await response.json()
    console.log('Backend test:', data)
  } catch (error) {
    console.error('Backend test failed:', error)
  }
})

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <Header @toggle-sidebar="toggleSidebar" />
  <Sidebar :is-open="isSidebarOpen" @close="closeSidebar" />
  <div class="layout">
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

<style></style>
