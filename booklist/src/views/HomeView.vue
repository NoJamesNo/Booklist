<template>
  <div class="home">
    <div>
      <HomeContent />
    </div>
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
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-background-soft);
}

.hero-title {
  font-size: var(--font-size-xxl);
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: var(--font-size-large);
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
