<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth.ts';
import { API_URL, PAYMENT_PHONE } from '@/config/api.ts';
import type { Order } from '@/types';

const authStore = useAuthStore();
const orders = ref<Order[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const clientId = authStore.user?.clientId;
  if (!clientId) {
    error.value = 'Vous devez être connecté';
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/orders/client/${clientId}`);
    if (!response.ok) throw new Error('Erreur lors du chargement');
    orders.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'en attente de paiement': return 'pending';
    case 'payée': return 'paid';
    case 'en préparation': return 'preparing';
    case 'expédiée': return 'shipped';
    case 'livrée': return 'delivered';
    case 'annulée': return 'cancelled';
    default: return '';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'en attente de paiement': return '⏳';
    case 'payée': return '✅';
    case 'en préparation': return '🍺';
    case 'expédiée': return '📦';
    case 'livrée': return '🎉';
    case 'annulée': return '❌';
    default: return '📋';
  }
};
</script>

<template>
  <div class="orders-page">
    <h1>Mes commandes</h1>

    <div v-if="loading" class="loading card">
      Chargement de vos commandes...
    </div>

    <div v-else-if="error" class="error card">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="orders.length === 0" class="empty card">
      <div class="empty-icon">📦</div>
      <h2>Aucune commande</h2>
      <p>Vous n'avez pas encore passé de commande.</p>
      <router-link to="/">
        <button>Découvrir nos bières</button>
      </router-link>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card card">
        <div class="order-header">
          <div class="order-info">
            <h2>Commande #{{ order.id }}</h2>
            <p class="order-date">{{ formatDate(order.order_date) }}</p>
          </div>
          <div class="order-status" :class="getStatusClass(order.status)">
            <span class="status-icon">{{ getStatusIcon(order.status) }}</span>
            <span class="status-text">{{ order.status }}</span>
          </div>
        </div>

        <div class="order-items">
          <div v-for="(item, index) in order.items" :key="index" class="order-item">
            <span class="item-qty">{{ item.quantity }}x</span>
            <span class="item-name">{{ item.recipe_name || item.name }}</span>
            <span class="item-price">{{ (item.price * item.quantity).toFixed(2) }}€</span>
          </div>
        </div>

        <div class="order-breakdown">
          <div v-if="order.initial_amount !== undefined && order.initial_amount !== order.amount" class="breakdown-line">
            <span>Prix initial</span>
            <span>{{ order.initial_amount.toFixed(2) }}€</span>
          </div>
          <div v-if="order.promo_code" class="breakdown-line promo">
            <span>Code promo ({{ order.promo_code }})</span>
            <span>-{{ (order.discount_amount || 0).toFixed(2) }}€</span>
          </div>
          <div v-if="order.extra_amount && order.extra_amount > 0" class="breakdown-line extra">
            <span>Don</span>
            <span>+{{ order.extra_amount.toFixed(2) }}€</span>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-total">
            <span>Total payé</span>
            <span class="total-amount">{{ order.amount.toFixed(2) }}€</span>
          </div>
          
          <div v-if="order.status === 'en attente de paiement'" class="payment-reminder">
            <p>💳 En attente de votre paiement via Wero ou Lydia au <strong>{{ PAYMENT_PHONE }}</strong></p>
            <p class="reference">Référence : <strong>CORTO-{{ order.id }}</strong></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  max-width: 900px;
  margin: 0 auto;
}

.orders-page h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.empty {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty h2 {
  margin-bottom: 0.5rem;
}

.empty p {
  color: #666;
  margin-bottom: 2rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  padding: 1.5rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.order-info h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.order-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
}

.order-status.pending {
  background: #fff3e0;
  color: #e65100;
}

.order-status.paid {
  background: #e8f5e9;
  color: #2e7d32;
}

.order-status.preparing {
  background: #e3f2fd;
  color: #1565c0;
}

.order-status.shipped {
  background: #f3e5f5;
  color: #7b1fa2;
}

.order-status.delivered {
  background: #e8f5e9;
  color: #1b5e20;
}

.order-status.cancelled {
  background: #ffebee;
  color: #c62828;
}

.status-icon {
  font-size: 1.1rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--border-color);
}

.order-item:last-child {
  border-bottom: none;
}

.item-qty {
  background: var(--secondary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 35px;
  text-align: center;
}

.item-name {
  flex: 1;
}

.item-price {
  font-weight: 500;
}

.order-breakdown {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.breakdown-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

.breakdown-line:last-child {
  margin-bottom: 0;
}

.breakdown-line.promo {
  color: #10b981;
  font-weight: 600;
}

.breakdown-line.extra {
  color: #8b5cf6;
}

.order-footer {
  padding-top: 1rem;
  border-top: 2px solid var(--secondary-color);
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.total-amount {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.payment-reminder {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3e0;
  border-radius: 8px;
  text-align: center;
}

.payment-reminder p {
  margin: 0.25rem 0;
}

.reference {
  font-size: 0.9rem;
  color: #666;
}

@media (max-width: 600px) {
  .order-header {
    flex-direction: column;
    gap: 1rem;
  }

  .order-status {
    align-self: flex-start;
  }

  .order-item {
    flex-wrap: wrap;
  }

  .item-name {
    flex-basis: 100%;
    order: -1;
    margin-bottom: 0.5rem;
  }
}
</style>
