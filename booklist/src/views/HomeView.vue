<template>
  <div class="home">
    <div><HomeContent /></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import HomeContent from '@/components/HomeContent.vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin: 0 auto;
}
</style>
