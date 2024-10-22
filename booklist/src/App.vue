<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <Header />
  <main>
    <RouterView />
  </main>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ffffff;
}

main {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}
</style>
