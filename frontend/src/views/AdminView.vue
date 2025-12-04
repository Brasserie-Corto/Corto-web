<template>
  <div class="admin-container">
    <h1>Admin Panel</h1>

    <!-- Only admins can see this page -->
    <div v-if="!isAdmin" class="error-message">
      <p>Vous n'avez pas la permission d'accéder à cette page.</p>
    </div>

    <div v-else>
      <!-- Admin navigation -->
      <div class="admin-nav">
        <router-link to="/admin" class="admin-nav-link active">👥 Utilisateurs</router-link>
        <router-link to="/admin/orders" class="admin-nav-link">📦 Commandes</router-link>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading">
        <p>Chargement des utilisateurs...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="fetchPendingUsers">Réessayer</button>
      </div>

      <!-- Users table -->
      <div v-if="!loading && !error" class="users-table">
        <h2>Pending Users ({{ pendingUsers.length }})</h2>

        <table v-if="pendingUsers.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in pendingUsers" :key="user.id">
              <td>{{ user.name }} {{ user.lastname }}</td>
              <td>{{ user.mail }}</td>
              <td>{{ user.phone }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button 
                  @click="activateUser(user.id)" 
                  class="btn-activate"
                  :disabled="activatingId === user.id"
                >
                  {{ activatingId === user.id ? 'Activating...' : 'Activate' }}
                </button>
                <button 
                  @click="rejectUser(user.id)" 
                  class="btn-reject"
                  :disabled="rejectingId === user.id"
                >
                  {{ rejectingId === user.id ? 'Rejecting...' : 'Reject' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else class="no-users">No pending users.</p>

        <h2 style="margin-top: 2rem;">Active Users ({{ activeUsers.length }})</h2>

        <table v-if="activeUsers.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Activated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in activeUsers" :key="user.id">
              <td>{{ user.name }} {{ user.lastname }}</td>
              <td>{{ user.mail }}</td>
              <td>{{ user.phone }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button 
                  @click="deactivateUser(user.id)" 
                  class="btn-deactivate"
                  :disabled="deactivatingId === user.id"
                >
                  {{ deactivatingId === user.id ? 'Deactivating...' : 'Deactivate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else class="no-users">No active users.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/config/supabase';

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

const isAdmin = computed(() => authStore.user?.role === 'admin');

const pendingUsers = computed(() => users.value.filter(u => !u.is_active));
const activeUsers = computed(() => users.value.filter(u => u.is_active));

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
    console.error('Fetch users error:', err);
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

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #555;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-message button {
  background-color: #c33;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.error-message button:hover {
  background-color: #a22;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #666;
}

.no-users {
  color: #999;
  font-style: italic;
  padding: 1rem;
}

.users-table {
  margin-top: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table thead {
  background-color: #f5f5f5;
  font-weight: bold;
}

table th,
table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

table tr:hover {
  background-color: #fafafa;
}

.admin-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--card-background);
  border-radius: 8px;
}

.admin-nav-link {
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: var(--text-color);
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.2s;
}

.admin-nav-link:hover {
  background: #f0f0f0;
}

.admin-nav-link.router-link-exact-active {
  background: var(--primary-color);
  color: white;
}

.btn-activate,
.btn-deactivate,
.btn-reject {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-activate {
  background-color: #28a745;
  color: white;
}

.btn-activate:hover:not(:disabled) {
  background-color: #218838;
}

.btn-deactivate {
  background-color: #ffc107;
  color: #333;
}

.btn-deactivate:hover:not(:disabled) {
  background-color: #e0a800;
}

.btn-reject {
  background-color: #dc3545;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background-color: #c82333;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
