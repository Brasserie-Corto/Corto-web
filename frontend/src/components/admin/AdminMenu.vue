<script setup lang="ts">
</script>

<template>
  <h1>Admin Panel</h1>
  <div class="admin-nav">
    <router-link to="/admin" class="admin-nav-link">
      👥 Utilisateurs
    </router-link>

    <router-link to="/admin/orders" class="admin-nav-link">
      📦 Commandes
    </router-link>

    <router-link to="/admin/calendar" class="admin-nav-link">
      📅 Calendrier
    </router-link>
  </div>
</template>

<style scoped>
.admin-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--card-background, white);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  flex-wrap: wrap;
}

.admin-nav-link {
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: var(--text-color, #333);
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-nav-link:hover {
  background: #f0f0f0;
}

.admin-nav-link.router-link-active,
.admin-nav-link.router-link-exact-active {
  background: var(--primary-color, #d4a017);
  color: white;
}
</style>