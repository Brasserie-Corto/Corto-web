<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { API_URL } from '@/config/api';
import type { Order } from '@/types';

const route = useRoute();
const order = ref<Order | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const orderId = route.params.orderId;
  
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    if (!response.ok) throw new Error('Commande introuvable');
    order.value = await response.json();
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
</script>

<template>
  <div class="confirmation-page">
    <div v-if="loading" class="loading card">
      Chargement de votre commande...
    </div>

    <div v-else-if="error" class="error card">
      <h2>Erreur</h2>
      <p>{{ error }}</p>
      <router-link to="/orders">
        <button>Voir mes commandes</button>
      </router-link>
    </div>

    <div v-else-if="order" class="confirmation-content">
      <!-- Success Banner -->
      <div class="success-banner card">
        <div class="success-icon">✅</div>
        <h1>Commande confirmée !</h1>
        <p>Commande n°{{ order.id }} du {{ formatDate(order.order_date) }}</p>
      </div>

      <!-- Order Summary -->
      <div class="order-summary card">
        <h2>Récapitulatif de votre commande</h2>
        
        <div class="order-items">
          <div v-for="item in order.items" :key="item.name" class="order-item">
            <img :src="item.imageUrl" :alt="item.name" class="item-image" />
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p>{{ item.quantity }} x {{ item.price.toFixed(2) }}€</p>
            </div>
            <div class="item-subtotal">
              {{ item.subtotal.toFixed(2) }}€
            </div>
          </div>
        </div>

        <div class="order-total">
          <span>Total</span>
          <span class="total-amount">{{ order.amount.toFixed(2) }}€</span>
        </div>
      </div>

      <!-- Payment Instructions -->
      <div class="payment-instructions card">
        <h2>📱 Instructions de paiement</h2>
        
        <div class="payment-notice">
          <p><strong>Votre commande est en attente de paiement.</strong></p>
          <p>Pour finaliser votre commande, veuillez effectuer le virement du montant total via l'une des méthodes suivantes :</p>
        </div>

        <div class="payment-methods">
          <div class="payment-method">
            <div class="method-icon">💳</div>
            <div class="method-info">
              <h3>Wero</h3>
              <p class="phone-number">06 06 06 06 06</p>
              <p class="instruction">Envoyez {{ order.amount.toFixed(2) }}€ avec la référence : <strong>CORTO-{{ order.id }}</strong></p>
            </div>
          </div>

          <div class="divider">ou</div>

          <div class="payment-method">
            <div class="method-icon">📲</div>
            <div class="method-info">
              <h3>Lydia</h3>
              <p class="phone-number">06 06 06 06 06</p>
              <p class="instruction">Envoyez {{ order.amount.toFixed(2) }}€ avec la référence : <strong>CORTO-{{ order.id }}</strong></p>
            </div>
          </div>
        </div>

        <div class="payment-warning">
          <p>⚠️ <strong>Important :</strong> N'oubliez pas d'indiquer la référence de commande <strong>CORTO-{{ order.id }}</strong> dans le message du virement pour que nous puissions identifier votre paiement.</p>
        </div>
      </div>

      <!-- Status Info -->
      <div class="status-info card">
        <h2>Statut de la commande</h2>
        <div class="status-badge pending">
          {{ order.status }}
        </div>
        <p>Vous recevrez une notification une fois le paiement validé par notre équipe.</p>
        <p>Vous pouvez suivre l'avancement de votre commande dans la section "Mes commandes".</p>
      </div>

      <!-- Actions -->
      <div class="actions">
        <router-link to="/orders">
          <button class="btn-secondary">Voir mes commandes</button>
        </router-link>
        <router-link to="/">
          <button>Continuer mes achats</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirmation-page {
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
}

.success-banner {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-banner h1 {
  color: #2e7d32;
  margin-bottom: 0.5rem;
}

.success-banner p {
  color: #558b2f;
}

.order-summary {
  margin-top: 2rem;
  padding: 2rem;
}

.order-summary h2 {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  flex: 1;
}

.item-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.item-info p {
  color: #666;
  margin: 0;
}

.item-subtotal {
  font-weight: bold;
  font-size: 1.1rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--secondary-color);
  font-size: 1.25rem;
  font-weight: bold;
}

.total-amount {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.payment-instructions {
  margin-top: 2rem;
  padding: 2rem;
}

.payment-instructions h2 {
  margin-bottom: 1.5rem;
}

.payment-notice {
  background: #fff3e0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.payment-notice p {
  margin: 0.5rem 0;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-method {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.method-icon {
  font-size: 2.5rem;
}

.method-info h3 {
  margin: 0 0 0.5rem;
}

.phone-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0.5rem 0;
}

.instruction {
  color: #666;
  font-size: 0.95rem;
}

.divider {
  text-align: center;
  color: #999;
  font-style: italic;
}

.payment-warning {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #ffebee;
  border-radius: 8px;
  border-left: 4px solid #f44336;
}

.payment-warning p {
  margin: 0;
}

.status-info {
  margin-top: 2rem;
  padding: 2rem;
  text-align: center;
}

.status-info h2 {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-badge.pending {
  background: #fff3e0;
  color: #e65100;
}

.status-info p {
  color: #666;
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-secondary {
  background: #6c757d;
}

@media (max-width: 600px) {
  .payment-method {
    flex-direction: column;
    text-align: center;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }
}
</style>
