<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { computed, ref } from 'vue';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'admin');
const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const handleLogout = async () => {
  closeMenu();
  await authStore.logout();
  // Redirect to auth page after logout (will also be handled by router guard)
  await router.push('/auth');
};
</script>

<template>
  <header class="header">
    <div class="header-content">
      <router-link to="/" class="brand" @click="closeMenu">Corto</router-link>
      
      <!-- Hamburger button for mobile -->
      <button v-if="authStore.isLoggedIn" class="hamburger" @click="toggleMenu" :class="{ active: menuOpen }" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="nav" :class="{ open: menuOpen }">
        <router-link v-if="authStore.isLoggedIn && authStore.isActive" to="/" @click="closeMenu">Boutique</router-link>
        <router-link v-if="authStore.isLoggedIn && authStore.isActive" to="/about" @click="closeMenu">À propos</router-link>
        <router-link v-if="authStore.isLoggedIn && authStore.isActive" to="/live" @click="closeMenu">La Brasserie</router-link>
        <router-link v-if="authStore.isLoggedIn && authStore.isActive" to="/contact" @click="closeMenu">Contact</router-link>
        <!-- <router-link to="/dashboard">Dashboard</router-link> -->
        <router-link v-if="isAdmin" to="/admin/users" @click="closeMenu">Admin</router-link>
        
        <!-- Mobile auth actions -->
        <div class="mobile-auth">
          <template v-if="authStore.isLoggedIn">
            <span class="welcome-message">Bienvenue, {{ authStore.user?.name }} !</span>
            <router-link v-if="authStore.isActive" to="/orders" class="orders-link" @click="closeMenu">Mes commandes</router-link>
            <button @click="handleLogout" class="logout-btn">Déconnexion</button>
          </template>
          <router-link v-else to="/auth" class="login-link" @click="closeMenu">Connexion</router-link>
        </div>
      </nav>

      <div class="actions">
        <div v-if="authStore.isLoggedIn" class="auth-actions">
          <router-link v-if="authStore.isActive" to="/orders" class="orders-link">Mes commandes</router-link>
          <span class="welcome-message">Bienvenue, {{ authStore.user?.name }} !</span>
          <button @click="handleLogout" class="logout-btn">Déconnexion</button>
        </div>
        <router-link v-else to="/auth" class="login-link">Connexion</router-link>

        <router-link v-if="authStore.isActive" to="/cart" class="cart-link" aria-label="Voir le panier" @click="closeMenu">
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
  z-index: 1002;
  flex-shrink: 0;
}

/* Hamburger menu button - hidden by default */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1002;
}

.hamburger span {
  width: 100%;
  height: 3px;
  background-color: var(--text-color);
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Navigation */
.nav {
  display: flex;
  align-items: center;
}

.nav a {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  margin-left: 2rem;
  padding-bottom: 5px;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  white-space: nowrap;
}

.nav a.router-link-exact-active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

/* Mobile auth section - hidden by default */
.mobile-auth {
  display: none;
}

/* Actions (cart + auth) */
.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: 2rem;
  flex-shrink: 0;
  flex-shrink: 0;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-message {
  font-weight: 500;
  white-space: nowrap;
  font-size: 0.9rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: var(--secondary-color);
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.login-link {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  text-decoration: none;
}

.orders-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.orders-link:hover {
  background: var(--primary-color);
  color: white;
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

/* Tablet - cacher le message de bienvenue desktop et réduire les espacements */
@media (max-width: 1100px) {
  .actions .welcome-message {
    display: none;
  }
  
  .nav a {
    margin-left: 1.5rem;
    font-size: 1rem;
  }
  
  .actions {
    gap: 1rem;
  }
}

/* Petit tablet - garder "Mes commandes" visible */
@media (max-width: 900px) {
  .auth-actions .welcome-message {
    display: none;
  }
}

/* Mobile - hamburger menu */
@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
  }

  .header-content {
    height: 70px;
  }

  /* Afficher le hamburger */
  .hamburger {
    display: flex;
    order: 3;
  }

  /* Cacher les actions auth desktop, garder seulement le panier */
  .actions {
    order: 2;
    gap: 0;
  }
  
  .actions .auth-actions,
  .actions .login-link {
    display: none;
  }

  .cart-icon {
    font-size: 1.6rem;
  }

  .cart-count {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }

  /* Menu mobile plein écran */
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--card-background);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 1001;
    padding: 80px 2rem 2rem;
    overflow-y: auto;
  }

  .nav.open {
    opacity: 1;
    visibility: visible;
  }

  .nav a {
    margin-left: 0;
    font-size: 1.4rem;
    padding: 1rem 0;
    border-bottom: none;
    display: block;
    text-align: center;
  }

  .nav a.router-link-exact-active {
    border-bottom: none;
    color: var(--primary-color);
  }

  /* Section auth dans le menu mobile */
  .mobile-auth {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color, #eee);
    width: 100%;
    max-width: 300px;
  }

  .mobile-auth .welcome-message {
    display: block !important;
    position: static !important;
    text-align: center;
    color: var(--text-color);
    font-size: 1rem;
    margin: 0;
    padding: 0;
  }

  .mobile-auth .orders-link {
    display: block !important;
    font-size: 1.1rem;
    padding: 0.8rem 1.5rem;
  }

  .mobile-auth .logout-btn {
    display: block !important;
    font-size: 1rem;
    padding: 0.6rem 1.5rem;
    margin-top: 0.5rem;
  }

  .mobile-auth .login-link {
    font-size: 1.2rem;
    padding: 0.8rem 2rem;
    background-color: var(--primary-color);
    color: white;
    border-radius: 4px;
  }
}

/* Très petit écran */
@media (max-width: 400px) {
  .brand {
    font-size: 1.6rem;
  }

  .nav a {
    font-size: 1.2rem;
    padding: 0.8rem 0;
  }
}
</style>