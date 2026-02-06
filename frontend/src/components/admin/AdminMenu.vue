<script setup lang="ts">
import { Users, Package, Calendar, TicketPercent } from 'lucide-vue-next';
</script>

<template>
  <div class="admin-nav">
    <router-link to="/admin/users" class="admin-nav-link link-users">
      <Users :size="20" class="nav-icon" />
      Utilisateurs
    </router-link>

    <router-link to="/admin/orders" class="admin-nav-link link-orders">
      <Package :size="20" class="nav-icon" />
      Commandes
    </router-link>

    <router-link to="/admin/calendar" class="admin-nav-link link-calendar">
      <Calendar :size="20" class="nav-icon" />
      Calendrier
    </router-link>

    <router-link to="/admin/promotion" class="admin-nav-link link-promo">
      <TicketPercent :size="20" class="nav-icon" />
      Promotions
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
  gap: 0.75rem;
}

.admin-nav-link:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.link-users .nav-icon { color: #3b82f6; }   /* Bleu */
.link-orders .nav-icon { color: #f59e0b; }  /* Orange */
.link-calendar .nav-icon { color: #8b5cf6; }/* Violet */
.link-promo .nav-icon { color: #10b981; }   /* Vert */

.admin-nav-link.router-link-active,
.admin-nav-link.router-link-exact-active {
  background: var(--primary-color, #d4a017);
  color: white;
  box-shadow: 0 4px 6px rgba(212, 160, 23, 0.2);
}

.admin-nav-link.router-link-active .nav-icon,
.admin-nav-link.router-link-exact-active .nav-icon {
  color: white !important;
}
</style>