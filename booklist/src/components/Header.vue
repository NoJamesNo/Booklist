<template>
  <header class="header">
    <h1>booklist</h1>
    <div class="auth-buttons">
      <template v-if="authInitialized">
        <template v-if="!user">
          <LoginModal />
          <SignUpModal />
        </template>
        <button v-else @click="logout">Logout</button>
      </template>
      <span v-else>Loading...</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth'
import LoginModal from './LoginModal.vue'
import SignUpModal from './SignUpModal.vue'

const auth = getAuth()
const user = ref(auth.currentUser)
const authInitialized = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    authInitialized.value = true
  })
})

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error during logout:', error)
  }
}
</script>

<style scoped>
.header {
  background-color: #f8f9fa;
  padding: 20px;
  border-bottom: 2px solid #e0e0e0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.auth-buttons button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.auth-buttons button:hover {
  background-color: #0056b3;
}
</style>
