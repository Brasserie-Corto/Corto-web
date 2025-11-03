<script setup lang="ts">
import TheHeader from './components/TheHeader.vue';
</script>

<template>
  <TheHeader />
  <main class="container">
    <router-view />
  </main>
</template>

<style scoped>
main {
  padding-top: 100px; /* Offset for fixed header + container padding */
}
</style>
