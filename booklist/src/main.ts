import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { user } from './firebase'

const app = createApp(App)
const pinia = createPinia()

app.use(createPinia())
app.use(router)
app.use(pinia)

app.provide('user', user)

app.mount('#app')
