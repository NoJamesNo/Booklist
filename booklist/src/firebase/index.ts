import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { ref } from 'vue'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Create a reactive user object
export const user = ref<User | null>(null)

// Set up auth state listener
onAuthStateChanged(auth, (currentUser) => {
  user.value = currentUser
})

// Function to get ID token
export const getIdToken = async () => {
  if (user.value) {
    return await user.value.getIdToken()
  } else {
    throw new Error('No user is signed in')
  }
}

export { auth }
