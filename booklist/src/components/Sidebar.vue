<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item">
          <RouterLink to="/home" class="nav-link">
            <span class="icon">📚</span>
            Popular Books
          </RouterLink>
        </li>
        <li class="nav-item"></li>
        <template v-if="currentUsername">
          <li class="nav-item">
            <RouterLink :to="`/${currentUsername}`" class="nav-link">
              <span class="icon">📖</span>
              My Books
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/add-book" class="nav-link">
              <span class="icon">➕</span>
              Add Book
            </RouterLink>
          </li>
        </template>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { fetchApi } from '@/config/api'

const currentUsername = ref('')

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const idToken = await user.getIdToken()
      const response = await fetchApi('/user', {
        headers: {
          Authorization: idToken
        }
      })
      const userData = await response.json()
      currentUsername.value = userData.username
    }
  })
})
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: calc(100vh);
  position: fixed;
  left: 0;
  top: 100px;
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border);
  padding: 20px 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 8px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: var(--color-text);
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: var(--color-background-soft);
}

.nav-link.router-link-active {
  background-color: var(--color-background-mute);
  font-weight: var(--font-weight-medium);
}

.icon {
  margin-right: 12px;
  font-size: 1.2em;
}
</style>
