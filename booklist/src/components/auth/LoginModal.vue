<template>
  <div class="login-modal">
    <button class="btn-login" @click="openModal">
      <span class="btn-text">Log in</span>
    </button>
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModalOnOverlayClick">
      <div class="modal">
        <h2 class="text-h2">Welcome Back</h2>
        <form @submit.prevent="handleSubmit">
          <input v-model="email" type="email" placeholder="Email" required />
          <input v-model="password" type="password" placeholder="Password" required />
          <button type="submit" class="btn-submit">Log In</button>
        </form>

        <div class="divider">
          <span class="divider-text">OR</span>
        </div>

        <div ref="googleButtonRef" class="google-button-container"></div>
        <button @click="closeModal" class="btn-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth'
import { useRouter } from 'vue-router'
import { fetchApi } from '@/config/api'

const isModalOpen = ref(false)
const email = ref('')
const password = ref('')
const googleButtonRef = ref<HTMLElement | null>(null)
const auth = getAuth()
const router = useRouter()

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSubmit = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    await createOrUpdateUser(userCredential.user)
    closeModal()
    email.value = ''
    password.value = ''
  } catch (error) {
    console.error('Login error:', error)
  }
}

const handleGoogleSignIn = async (response: any) => {
  const auth = getAuth()
  const credential = GoogleAuthProvider.credential(response.credential)
  try {
    const userCredential = await signInWithCredential(auth, credential)
    await createOrUpdateUser(userCredential.user)
    closeModal()
  } catch (error) {
    console.error('Google sign-in error:', error)
  }
}

const createOrUpdateUser = async (user: any) => {
  const idToken = await user.getIdToken()
  try {
    const response = await fetchApi('/user', {
      method: 'POST',
      headers: {
        Authorization: idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: user.displayName,
        email: user.email
      })
    })

    const { user: userData } = await response.json()
    router.push(`/${userData.username}`)
  } catch (error) {
    console.error('Error:', error)
  }
}

const closeModalOnOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

const renderGoogleButton = () => {
  if (googleButtonRef.value && window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn
    })
    window.google.accounts.id.renderButton(googleButtonRef.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      width: 280 // Add this to make button wider
    })
  }
}

onMounted(() => {
  if (window.google) {
    renderGoogleButton()
  } else {
    const checkGoogleApi = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleApi)
        renderGoogleButton()
      }
    }, 100)
  }
})

watch(isModalOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      renderGoogleButton()
    })
  }
})
</script>
<style scoped>
.login-modal {
  display: inline-block;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.modal {
  background-color: var(--color-background);
  padding: 32px;
  border-radius: 16px;
  width: 400px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.modal h2 {
  margin-bottom: 24px;
  text-align: center;
  color: var(--color-text);
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  background-color: var(--color-background-soft);
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-accent);
}

input::placeholder {
  color: var(--color-text-soft);
}

.btn-login {
  padding: 12px;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  background-color: var(--color-accent);
  color: white;
  transition: all 0.2s ease;
}

.btn-text {
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-login:hover {
  transform: translateY(-1px);
  filter: brightness(110%);
}

.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-accent);
  color: white;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  filter: brightness(110%);
}

.btn-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: var(--color-background-mute);
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--color-border);
}

.divider-text {
  position: relative;
  background-color: var(--color-background);
  padding: 0 12px;
  color: var(--color-text-soft);
  font-size: var(--font-size-small);
}

.google-button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

:deep(.google-button-container iframe) {
  margin: 0 auto;
}

:deep(#googleButtonRef) {
  display: flex;
  justify-content: center;
}

:deep(#googleButtonRef > div) {
  width: 100% !important;
}

:deep(#googleButtonRef iframe) {
  scale: 1.2;
}
</style>
