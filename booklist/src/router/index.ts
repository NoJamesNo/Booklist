import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BookCollectionView from '../views/BookCollectionView.vue'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import AddBookView from '../views/AddBookView.vue'
import BookDetailsView from '../views/BookDetailsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresGuest: true }
    },
    {
      path: '/:username',
      name: 'user-books',
      component: BookCollectionView,
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    },
    {
      path: '/home',
      name: 'database',
      component: HomeView
    },
    {
      path: '/add-book',
      name: 'AddBook',
      component: AddBookView,
      meta: { requiresAuth: true }
    },
    {
      path: '/books/:bookId',
      name: 'BookDetails',
      component: BookDetailsView
    }
  ]
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const auth = getAuth()

  // Create a promise that resolves when auth state is known
  const authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })

  const user = (await authReady) as any

  if (user && to.path === '/') {
    try {
      const idToken = await user.getIdToken()
      const response = await fetch('/api/user', {
        headers: { Authorization: idToken }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await response.json()
      next(`/${userData.username}`)
    } catch (error) {
      console.error('Error fetching user data:', error)
      next()
    }
  } else if (to.meta.requiresGuest && user) {
    // If trying to access guest-only page while logged in
    try {
      const idToken = await user.getIdToken()
      const response = await fetch('/api/user', {
        headers: { Authorization: idToken }
      })
      const userData = await response.json()
      next(`/${userData.username}`)
    } catch (error) {
      console.error('Error fetching user data:', error)
      next()
    }
  } else {
    next()
  }
})

export default router
