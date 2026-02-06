<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/config/api';
import AdminMenu from '@/components/admin/AdminMenu.vue';

interface OrderItem {
  beer_id: number;
  contening_id: number;
  quantity: number;
  recipe_name: string;
  volume: number;
  price: number;
}

interface Order {
  id: number;
  order_date: string;
  deliver_date: string | null;
  amount: number;
  status: string;
  client_name: string;
  client_lastname: string;
  client_email: string;
  client_phone: string;
  items: OrderItem[];
}

const authStore = useAuthStore();
const orders = ref<Order[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const updatingId = ref<number | null>(null);
const filterStatus = ref<string>('all');

const isAdmin = computed(() => authStore.user?.role === 'admin');

const statusOptions = [
  { value: 'en attente de paiement', label: 'En attente de paiement', color: '#f59e0b' },
  { value: 'en attente de livraison', label: 'En attente de livraison', color: '#3b82f6' },
  { value: 'livré', label: 'Livré', color: '#10b981' },
];

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return orders.value;
  return orders.value.filter(order => order.status === filterStatus.value);
});

const orderStats = computed(() => {
  const pending = orders.value.filter(o => o.status === 'en attente de paiement').length;
  const awaiting = orders.value.filter(o => o.status === 'en attente de livraison').length;
  const delivered = orders.value.filter(o => o.status === 'livré').length;
  return { pending, awaiting, delivered, total: orders.value.length };
});

const fetchOrders = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetch(`${API_URL}/admin/orders`);
    if (!response.ok) throw new Error('Erreur lors du chargement des commandes');
    orders.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (orderId: number, newStatus: string) => {
  try {
    updatingId.value = orderId;
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    
    // Mettre à jour localement
    const index = orders.value.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders.value[index].status = newStatus;
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    updatingId.value = null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatVolume = (volume: number) => {
  return `${volume / 10}cl`;
};

const getStatusColor = (status: string) => {
  const option = statusOptions.find(o => o.value === status);
  return option?.color || '#6b7280';
};

onMounted(fetchOrders);
</script>

<template>
  <div class="admin-orders">
    <div v-if="!isAdmin" class="error-message">
      <p>Vous n'avez pas la permission d'accéder à cette page.</p>
    </div>

    <template v-else>
      <AdminMenu />

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card" @click="filterStatus = 'all'">
          <span class="stat-value">{{ orderStats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card pending" @click="filterStatus = 'en attente de paiement'">
          <span class="stat-value">{{ orderStats.pending }}</span>
          <span class="stat-label">En attente de paiement</span>
        </div>
        <div class="stat-card awaiting" @click="filterStatus = 'en attente de livraison'">
          <span class="stat-value">{{ orderStats.awaiting }}</span>
          <span class="stat-label">En attente de livraison</span>
        </div>
        <div class="stat-card delivered" @click="filterStatus = 'livré'">
          <span class="stat-value">{{ orderStats.delivered }}</span>
          <span class="stat-label">Livrées</span>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <label>Filtrer par statut :</label>
        <select v-model="filterStatus">
          <option value="all">Toutes les commandes</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button @click="fetchOrders" class="btn-refresh">🔄 Rafraîchir</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">Chargement des commandes...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="fetchOrders">Réessayer</button>
      </div>

      <!-- Orders list -->
      <div v-else class="orders-list">
        <div v-if="filteredOrders.length === 0" class="no-orders">
          Aucune commande trouvée.
        </div>

        <div v-for="order in filteredOrders" :key="order.id" class="order-card">
          <div class="order-header">
            <div class="order-info">
              <span class="order-id">Commande #{{ order.id }}</span>
              <span class="order-date">{{ formatDate(order.order_date) }}</span>
            </div>
            <span 
              class="status-badge" 
              :style="{ backgroundColor: getStatusColor(order.status) }"
            >
              {{ order.status }}
            </span>
          </div>

          <div class="order-client">
            <strong>{{ order.client_name }} {{ order.client_lastname }}</strong>
            <span>{{ order.client_email }}</span>
            <span>📞 {{ order.client_phone }}</span>
          </div>

          <div class="order-items">
            <div v-for="(item, idx) in order.items" :key="idx" class="order-item">
              <span class="item-name">{{ item.recipe_name }}</span>
              <span class="item-volume">{{ formatVolume(item.volume) }}</span>
              <span class="item-qty">× {{ item.quantity }}</span>
              <span class="item-price">{{ (item.price * (item.volume / 1000) * item.quantity).toFixed(2) }}€</span>
            </div>
          </div>

          <div class="order-footer">
            <span class="order-total">Total : {{ order.amount.toFixed(2) }}€</span>
            
            <div class="status-actions">
              <button
                v-if="order.status === 'en attente de paiement'"
                @click="updateStatus(order.id, 'en attente de livraison')"
                :disabled="updatingId === order.id"
                class="btn-paid"
              >
                {{ updatingId === order.id ? '...' : '✓ Marquer payée' }}
              </button>
              <button
                v-if="order.status === 'en attente de livraison'"
                @click="updateStatus(order.id, 'livré')"
                :disabled="updatingId === order.id"
                class="btn-delivered"
              >
                {{ updatingId === order.id ? '...' : '📦 Marquer livrée' }}
              </button>
              <span v-if="order.status === 'livré'" class="delivered-badge">
                ✓ Livrée
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-orders {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1.5rem;
  color: var(--secondary-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-background);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.pending {
  border-color: #f59e0b;
}

.stat-card.awaiting {
  border-color: #3b82f6;
}

.stat-card.delivered {
  border-color: #10b981;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: var(--secondary-color);
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--card-background);
  border-radius: 8px;
}

.filter-bar select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-refresh {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading, .error-message, .no-orders {
  text-align: center;
  padding: 3rem;
  background: var(--card-background);
  border-radius: 8px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-id {
  font-weight: bold;
  font-size: 1.1rem;
}

.order-date {
  font-size: 0.85rem;
  color: #666;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.order-client {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-volume {
  color: #666;
  font-size: 0.9rem;
}

.item-qty {
  color: #666;
}

.item-price {
  font-weight: 500;
  min-width: 70px;
  text-align: right;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.order-total {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--secondary-color);
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-paid {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-paid:hover {
  background: #2563eb;
}

.btn-delivered {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-delivered:hover {
  background: #059669;
}

.delivered-badge {
  padding: 0.5rem 1rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 4px;
  font-weight: 500;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-wrap: wrap;
  }

  .order-client {
    flex-direction: column;
    gap: 0.5rem;
  }

  .order-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .order-item {
    flex-wrap: wrap;
  }
}
</style>
