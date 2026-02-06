<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth.ts';
import { supabase } from '@/config/supabase.ts';
import AdminMenu from '@/components/admin/AdminMenu.vue';

interface ClientUser {
  id: number;
  user_id: string;
  name: string;
  lastname: string;
  mail: string;
  phone: string;
  address: string;
  is_active: boolean;
  role: string;
  created_at: string;
}

const authStore = useAuthStore();
const users = ref<ClientUser[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activatingId = ref<number | null>(null);
const rejectingId = ref<number | null>(null);
const deactivatingId = ref<number | null>(null);
const searchQuery = ref('');

const isAdmin = computed(() => authStore.user?.role === 'admin');

const matchesSearch = (user: ClientUser) => {
  if (!searchQuery.value) return true;
  const query = searchQuery.value.toLowerCase();
  return (
      (user.name?.toLowerCase() || '').includes(query) ||
      (user.lastname?.toLowerCase() || '').includes(query) ||
      (user.mail?.toLowerCase() || '').includes(query) ||
      (user.phone || '').includes(query)
  );
};

const pendingUsers = computed(() => users.value.filter(u => !u.is_active && matchesSearch(u)));
const activeUsers = computed(() => users.value.filter(u => u.is_active && matchesSearch(u)));

/**
 * Fetch all users from the client table
 */
async function fetchPendingUsers() {
  try {
    loading.value = true;
    error.value = null;

    const { data, error: fetchError } = await supabase
      .from('client')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    users.value = data || [];
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch users';
  } finally {
    loading.value = false;
  }
}

/**
 * Activate a user
 */
async function activateUser(userId: number) {
  try {
    activatingId.value = userId;

    const { error: updateError } = await supabase
      .from('client')
      .update({ is_active: true })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Update local state
    const user = users.value.find(u => u.id === userId);
    if (user) {
      user.is_active = true;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to activate user';
    console.error('Activate user error:', err);
  } finally {
    activatingId.value = null;
  }
}

/**
 * Deactivate a user
 */
async function deactivateUser(userId: number) {
  try {
    deactivatingId.value = userId;

    const { error: updateError } = await supabase
      .from('client')
      .update({ is_active: false })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Update local state
    const user = users.value.find(u => u.id === userId);
    if (user) {
      user.is_active = false;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to deactivate user';
    console.error('Deactivate user error:', err);
  } finally {
    deactivatingId.value = null;
  }
}

/**
 * Reject/delete a user
 */
async function rejectUser(userId: number) {
  const confirmed = confirm('Are you sure you want to reject this user? This action cannot be undone.');
  if (!confirmed) return;

  try {
    rejectingId.value = userId;

    const user = users.value.find(u => u.id === userId);
    if (!user?.user_id) throw new Error('User not found');

    // Delete from Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.user_id);
    if (deleteAuthError) throw deleteAuthError;

    // Delete from client table
    const { error: deleteClientError } = await supabase
      .from('client')
      .delete()
      .eq('id', userId);

    if (deleteClientError) throw deleteClientError;

    // Update local state
    users.value = users.value.filter(u => u.id !== userId);
  } catch (err: any) {
    error.value = err.message || 'Failed to reject user';
    console.error('Reject user error:', err);
  } finally {
    rejectingId.value = null;
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  if (isAdmin.value) {
    fetchPendingUsers();
  }
});
</script>

<template>
  <div class="admin-users">
    <div v-if="!isAdmin" class="error-message">Accès refusé.</div>

    <template v-else>
      <AdminMenu />

      <div v-if="loading" class="loading">Chargement...</div>
      <div v-if="error" class="error-message">
        {{ error }} <button @click="fetchPendingUsers">Réessayer</button>
      </div>

      <div v-if="!loading && !error" class="users-content">

        <div class="search-bar">
          <input v-model="searchQuery" type="text" placeholder="🔍 " />
        </div>

        <div class="section-block">
          <h2 class="section-title">En attente <span class="badge pending">{{ pendingUsers.length }}</span></h2>

          <div v-if="pendingUsers.length === 0" class="no-users">
            {{ searchQuery ? 'Aucun résultat.' : 'Aucune demande en attente.' }}
          </div>

          <div v-else class="users-list">
            <div v-for="user in pendingUsers" :key="user.id" class="user-row compact">

              <div class="col-identity">
                <span class="user-name">{{ user.name }} {{ user.lastname }}</span>
                <span class="user-date">{{ formatDate(user.created_at) }}</span>
              </div>

              <div class="col-contact">
                <span class="info-tag">{{ user.mail }}</span>
                <span class="info-tag">{{ user.phone }}</span>
              </div>

              <div class="col-actions">
                <button
                    @click="activateUser(user.id)"
                    class="btn-icon success"
                    title="Valider"
                    :disabled="activatingId === user.id"
                >
                  {{ activatingId === user.id ? '...' : '✓' }}
                </button>
                <button
                    @click="rejectUser(user.id)"
                    class="btn-icon danger"
                    title="Refuser"
                    :disabled="rejectingId === user.id"
                >
                  {{ rejectingId === user.id ? '...' : '✕' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section-block">
          <h2 class="section-title">Actifs <span class="badge active">{{ activeUsers.length }}</span></h2>

          <div v-if="activeUsers.length === 0" class="no-users">
            {{ searchQuery ? 'Aucun résultat.' : 'Aucun utilisateur actif.' }}
          </div>

          <div v-else class="users-list">
            <div v-for="user in activeUsers" :key="user.id" class="user-row compact">

              <div class="col-identity">
                <span class="user-name">{{ user.name }} {{ user.lastname }}</span>
                <span class="user-date">{{ formatDate(user.created_at) }}</span>
              </div>

              <div class="col-contact">
                <span class="info-tag">{{ user.mail }}</span>
                <span class="info-tag">{{ user.phone }}</span>
              </div>

              <div class="col-actions">
                <button
                    @click="deactivateUser(user.id)"
                    class="btn-icon warning"
                    title="Désactiver"
                    :disabled="deactivatingId === user.id"
                >
                  {{ deactivatingId === user.id ? '...' : '⊘' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-users {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.search-bar {
  margin-bottom: 2rem;
}
.search-bar input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.section-block {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--secondary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  color: white;
  vertical-align: middle;
}
.badge.pending { background: #f59e0b; }
.badge.active { background: #10b981; }

.loading, .error-message, .no-users {
  text-align: center;
  padding: 2rem;
  background: var(--card-background, #fff);
  border-radius: 8px;
  color: #666;
  font-size: 0.9rem;
}

/* --- COMPACT ROW SYSTEM --- */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-background, #fff);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.user-row:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #eee;
}

.col-identity {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.user-name {
  font-weight: 600;
  color: var(--text-color, #333);
  font-size: 0.95rem;
}

.user-date {
  font-size: 0.75rem;
  color: #888;
}

.col-contact {
  flex: 1;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

.info-tag {
  background: #f3f4f6;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #555;
  white-space: nowrap;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
  color: white;
}

.btn-icon.success { background-color: #10b981; }
.btn-icon.success:hover:not(:disabled) { background-color: #059669; }

.btn-icon.danger { background-color: #ef4444; }
.btn-icon.danger:hover:not(:disabled) { background-color: #dc2626; }

.btn-icon.warning { background-color: #f59e0b; }
.btn-icon.warning:hover:not(:disabled) { background-color: #d97706; }

.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .user-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .col-contact { padding: 0; width: 100%; }
  .col-actions { width: 100%; justify-content: flex-end; }
}
</style>
