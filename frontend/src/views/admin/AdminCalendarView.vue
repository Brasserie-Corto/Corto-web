<script setup lang="ts">
import {computed} from "vue";
import {useAuthStore} from "@/store/auth.ts";
import AdminMenu from "@/components/admin/AdminMenu.vue";
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'admin');
</script>

<template>
  <div class="admin-users">
    <div v-if="!isAdmin" class="error-message">Accès refusé.</div>
    <template v-else>
      <AdminMenu />
    </template>
  </div>
</template>

<style scoped>
.admin-users {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}
</style>