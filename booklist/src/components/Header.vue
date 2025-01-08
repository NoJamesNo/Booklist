<template>
  <header class="header">
    <div class="brand">
      <img src="/images/logo.png" alt="Booklist Logo" class="logo" />
      <router-link :to="user ? `/${userData?.username}` : '/home'" class="text-logo logo-link">
        NOVELOG
      </router-link>
      <span class="alpha-tag">alpha</span>
    </div>
    <div class="auth-buttons">
      <template v-if="authInitialized">
        <template v-if="!user">
          <LoginModal />
          <SignUpModal />
        </template>
        <div v-else class="profile-container">
          <div class="profile-button" @click="toggleDropdown">
            <div class="profile-info">
              <span class="username">{{ userData?.username }}</span>
            </div>
            <svg
              class="profile-picture"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div v-if="isDropdownOpen" class="profile-dropdown">
            <button @click="navigateToProfile" class="dropdown-item">
              <svg
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              View Profile
            </button>
            <button @click="handleLogout" class="dropdown-item">
              <svg
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </template>
      <span v-else class="text-small">Loading...</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import LoginModal from './auth/LoginModal.vue'
import SignUpModal from './auth/SignUpModal.vue'

const auth = getAuth()
const router = useRouter()
const user = ref(auth.currentUser)
const authInitialized = ref(false)
const userData = ref<any>(null)
const isDropdownOpen = ref(false)

const handleClickOutside = (event: MouseEvent) => {
  const profileContainer = document.querySelector('.profile-container')
  if (profileContainer && !profileContainer.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser
    authInitialized.value = true
    if (currentUser) {
      const idToken = await currentUser.getIdToken()
      const response = await fetch('/api/user', {
        headers: { Authorization: idToken }
      })
      userData.value = await response.json()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const navigateToProfile = () => {
  router.push(`/${userData.value?.username}`)
  isDropdownOpen.value = false
}

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push('/home')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style scoped>
.header {
  padding: 10px 20px;
  border-bottom: 2px solid var(--color-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100px;
  background-color: var(--color-background);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  height: 48px;
  width: auto;
  object-fit: contain;
  margin: 16px;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.btn-auth {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  transition: background-color 0.2s ease;
}

.btn-auth:hover {
  background-color: #7a3838;
}

.logo-link {
  text-decoration: none;
  transition: color 0.2s ease;
}

.logo-link:hover {
  color: var(--color-accent);
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-button:hover {
  background-color: var(--color-background-mute);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.username {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.view-profile {
  font-size: var(--font-size-small);
  color: var(--color-text-soft);
}

.profile-picture {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.alpha-tag {
  font-size: var(--font-size-small);
  color: var(--color-text-soft);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
}

.profile-container {
  position: relative;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--color-background-soft);
}

.dropdown-item:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-soft);
}
</style>
