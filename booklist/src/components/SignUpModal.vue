<template>
  <div class="signup-modal">
    <button @click="openModal">Sign Up</button>
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModalOnOverlayClick">
      <div class="modal">
        <h2>Sign Up</h2>
        <form @submit.prevent="handleSubmit">
          <input v-model="email" type="email" placeholder="Email" required />
          <input v-model="password" type="password" placeholder="Password" required />
          <button type="submit">Sign Up</button>
        </form>
        <div ref="googleButtonRef"></div>
        <button @click="closeModal" class="close-button">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth'
import { useRouter } from 'vue-router'

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
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    await createOrUpdateUser(userCredential.user)
    closeModal()
    email.value = ''
    password.value = ''
  } catch (error) {
    console.error('Sign up error:', error)
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
  console.log('idToken', idToken)
  try {
    const response = await fetch('/api/user', {
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

    // Log the raw response
    const rawResponse = await response.text()
    console.log('Raw server response:', rawResponse)

    if (!response.ok) {
      throw new Error(`Failed to create/update user in database: ${rawResponse}`)
    }

    // Only try to parse as JSON if the response is ok
    const responseData = JSON.parse(rawResponse)
    console.log('User created/updated in database', responseData)
  } catch (error) {
    console.error('Error creating/updating user in database:', error)
    // Handle error (show error message to user)
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
      logo_alignment: 'left'
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
.signup-modal {
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
}

.modal {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

input,
button {
  padding: 8px;
}

.close-button {
  margin-top: 10px;
}
</style>
