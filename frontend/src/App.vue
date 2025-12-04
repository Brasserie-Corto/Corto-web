<script setup lang="ts">
import { onMounted } from 'vue';
import TheHeader from './components/TheHeader.vue';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

const cartStore = useCartStore();
const authStore = useAuthStore();

// Charger le panier au démarrage si l'utilisateur est connecté
onMounted(async () => {
  // Attendre que l'auth soit initialisée
  await authStore.initializeAuth();
  
  // Si l'utilisateur est connecté, charger le panier
  if (authStore.isLoggedIn) {
    await cartStore.fetchCart();
  }
});
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
