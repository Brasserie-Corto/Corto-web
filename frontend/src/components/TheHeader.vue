<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { computed } from 'vue';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'admin');

const handleLogout = () => {
  authStore.logout();
  // Redirect to home page after logout
  router.push('/');
};
</script>

<template>
  <header class="header">
    <div class="header-content">
      <router-link to="/" class="brand">Corto</router-link>
      <nav class="nav">
        <router-link to="/">Shop</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/live">Live Stream</router-link>
        <router-link to="/contact">Contact</router-link>
        <router-link v-if="isAdmin" to="/admin" class="admin-link">Admin</router-link>
      </nav>
      <div class="actions">
        <div v-if="authStore.isLoggedIn" class="auth-actions">
          <span class="welcome-message">Welcome, {{ authStore.user?.name }}!</span>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
        <router-link v-else to="/auth" class="login-link">Login</router-link>

        <router-link to="/cart" class="cart-link" aria-label="View shopping cart">
          <div class="cart">
            <span class="cart-icon" role="img" aria-hidden="true">🍺</span>
            <span class="cart-count" v-if="cartStore.totalItems > 0">{{ cartStore.totalItems }}</span>
          </div>
        </router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--card-background);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding: 0 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  height: 80px;
}

.brand {
  font-size: 2rem;
  font-weight: bold;
  color: var(--secondary-color);
}

.nav a {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  margin-left: 2rem;
  padding-bottom: 5px;
  border-bottom: 2px solid transparent;
}

.nav a.router-link-exact-active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-message {
  font-weight: 500;
  white-space: nowrap;
}

.logout-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: var(--secondary-color);
}

.login-link {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
}

.cart-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.cart {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.cart-icon {
  font-size: 2rem;
}

.cart-count {
  position: absolute;
  top: -5px;
  right: -10px;
  background-color: var(--secondary-color);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.9rem;
  font-weight: bold;
}
</style>