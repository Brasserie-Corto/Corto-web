<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cart.ts';

const cartStore = useCartStore();
const router = useRouter();
const now = ref(new Date());
let timerInterval: number | null = null;

const tipAmount = ref<number>(0);
const promoInput = ref('');

onMounted(async () => {
  await cartStore.fetchCart();

  timerInterval = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const countdown = computed(() => {
  if (!cartStore.expiresAt) return null;
  const diff = cartStore.expiresAt.getTime() - now.value.getTime();
  if (diff <= 0) return { expired: true, minutes: 0, seconds: 0 };
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { expired: false, minutes, seconds };
});

const isExpiringSoon = computed(() => {
  return countdown.value && !countdown.value.expired && countdown.value.minutes < 5;
});

const finalTotal = computed(() => {
  const base = parseFloat(cartStore.totalPrice);
  const tip = typeof tipAmount.value === 'number' && !isNaN(tipAmount.value) ? tipAmount.value : 0;
  return base + tip;
});

const roundUpDiff = computed(() => {
  const current = finalTotal.value;
  if (current % 1 === 0) return 0;
  return (Math.ceil(current) - current).toFixed(2);
});

const handleRoundUp = () => {
  const diff = parseFloat(roundUpDiff.value);
  if (diff > 0) {
    tipAmount.value = Number((tipAmount.value + diff).toFixed(2));
  }
};

const handleApplyPromo = async () => {
  if (!promoInput.value) return;
  await cartStore.applyPromo(promoInput.value.toUpperCase());
};

const handleRemovePromo = () => {
  promoInput.value = '';
  cartStore.removePromo();
};

const handleCheckout = async () => {
  const order = await cartStore.checkout(finalTotal.value);
  if (order) {
    router.push({ name: 'OrderConfirmation', params: { orderId: order.id } });
  }
};

const handleExtendTime = () => {
  cartStore.extendTime();
};
</script>

<template>
  <div class="cart-page">
    <h1>Votre panier</h1>
    
    <!-- Timer Banner -->
    <div v-if="cartStore.items.length > 0 && countdown" class="timer-banner" :class="{ warning: isExpiringSoon, expired: countdown.expired }">
      <template v-if="countdown.expired">
        <span class="timer-icon">⏰</span>
        <span>Votre panier a expiré ! Les articles ont été libérés.</span>
        <button @click="cartStore.fetchCart()" class="refresh-btn">Actualiser</button>
      </template>
      <template v-else>
        <span class="timer-icon">⏱️</span>
        <span>
          Vos articles sont réservés pendant 
          <strong>{{ countdown.minutes }}:{{ countdown.seconds.toString().padStart(2, '0') }}</strong>
        </span>
        <button v-if="isExpiringSoon" @click="handleExtendTime" class="extend-btn">
          Prolonger (+15 min)
        </button>
      </template>
    </div>

    <!-- Error message -->
    <div v-if="cartStore.error" class="error-banner">
      {{ cartStore.error }}
    </div>

    <div v-if="cartStore.loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="cartStore.items.length > 0 && !countdown?.expired" class="cart-content card">
      <div class="cart-items">
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
          <img :src="item.imageUrl" :alt="item.name" class="item-image" />
          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <p class="item-volume">{{ item.volume >= 1000 ? `${item.volume / 1000}L` : `${item.volume / 10}cl` }}</p>
            <p class="item-price">{{ item.price.toFixed(2) }}€ / unité</p>
          </div>
          <div class="item-quantity">
            <button @click="cartStore.decreaseQuantity(item.id)" class="quantity-btn" :disabled="cartStore.loading">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cartStore.increaseQuantity(item.id)" class="quantity-btn" :disabled="cartStore.loading">+</button>
          </div>
          <div class="item-subtotal">
            <p>{{ (item.price * item.quantity).toFixed(2) }}€</p>
          </div>
          <div class="item-remove">
            <button @click="cartStore.removeItem(item.id)" class="remove-btn" aria-label="Supprimer" :disabled="cartStore.loading">
              &times;
            </button>
          </div>
        </div>
      </div>

      <div class="cart-summary">

        <div class="promo-section">
          <label>Code Promo</label>
          <div v-if="cartStore.promoCode" class="active-promo">
            <span class="promo-badge">{{ cartStore.promoCode }}</span>
            <span class="promo-discount">-{{ cartStore.discountAmount.toFixed(2) }}€</span>
            <button @click="handleRemovePromo" class="remove-promo-btn">&times;</button>
          </div>
          <div v-else class="promo-input-group">
            <input v-model="promoInput" type="text" placeholder="Entrez votre code" style="text-transform: uppercase;" />
            <button @click="handleApplyPromo" class="btn-apply-promo" :disabled="!promoInput">Appliquer</button>
          </div>
          <div v-if="cartStore.promoError" class="promo-error">{{ cartStore.promoError }}</div>
        </div>

        <div class="summary-breakdown">
          <div class="summary-line">
            <span>Prix initial</span>
            <span>{{ cartStore.rawTotalPrice.toFixed(2) }}€</span>
          </div>
          <div v-if="cartStore.promoCode" class="summary-line discount-line">
            <span>Code promo ({{ cartStore.promoCode }})</span>
            <span>-{{ cartStore.discountAmount.toFixed(2) }}€</span>
          </div>

          <div class="tip-section">
            <label>Soutenir la brasserie (Don)</label>
            <div class="tip-controls">
              <button @click="tipAmount = 0" :class="{active: tipAmount === 0}">0€</button>
              <button @click="tipAmount = 2" :class="{active: tipAmount === 2}">2€</button>
              <button @click="tipAmount = 5" :class="{active: tipAmount === 5}">5€</button>
              <button @click="tipAmount = 10" :class="{active: tipAmount === 10}">10€</button>
              <div class="custom-tip">
                <input type="number" v-model.number="tipAmount" min="0" step="0.5" placeholder="Autre" />
                <span>€</span>
              </div>
            </div>
          </div>
        </div>

        <div class="final-total-section">
          <h2>Reste à payer : <span class="total-price">{{ finalTotal.toFixed(2) }}€</span></h2>

          <button v-if="finalTotal % 1 !== 0" @click="handleRoundUp" class="round-up-btn">
            Arrondir à {{ Math.ceil(finalTotal) }}€ (+{{ roundUpDiff }}€)
          </button>
        </div>

        <button @click="handleCheckout" class="checkout-btn" :disabled="cartStore.loading">
          {{ cartStore.loading ? 'Traitement...' : 'Passer commande' }}
        </button>
      </div>
    </div>

    <div v-else class="empty-cart card">
      <h2>Votre panier est vide.</h2>
      <p>On dirait que vous n'avez pas encore ajouté de bières. Allez, on y va !</p>
      <router-link to="/">
        <button>Continuer mes achats</button>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.cart-page h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.timer-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 500;
}

.timer-banner.warning {
  background: #fff3e0;
  color: #e65100;
  animation: pulse 2s infinite;
}

.timer-banner.expired {
  background: #ffebee;
  color: #c62828;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.timer-icon {
  font-size: 1.5rem;
}

.extend-btn, .refresh-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-banner {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  background: #ffebee;
  color: #c62828;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.cart-content {
  padding: 2rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.item-details h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.item-volume {
  font-size: 0.9rem;
  color: var(--secondary-color);
  font-weight: 600;
  margin: 0.25rem 0;
}

.item-price {
  color: #6c757d;
  font-size: 0.9rem;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.item-quantity span {
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-subtotal {
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-summary {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border-top: 2px solid var(--secondary-color);
  padding-top: 2rem;
}

.promo-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.promo-section label {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  display: block;
}

.promo-input-group {
  display: flex;
  gap: 0.5rem;
}

.promo-input-group input {
  flex: 1;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
}

.btn-apply-promo {
  padding: 0.5rem 1rem;
  background: var(--secondary-color);
  font-size: 0.9rem;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.active-promo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #dcfce7;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.promo-badge {
  font-weight: bold;
  color: #166534;
  letter-spacing: 1px;
}

.promo-discount {
  font-weight: bold;
  color: #15803d;
}

.remove-promo-btn {
  background: none;
  border: none;
  color: #166534;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.promo-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.summary-breakdown {
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--border-color);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #475569;
}

.discount-line {
  color: #10b981;
  font-weight: 600;
}

.tip-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-color);
}

.tip-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

.tip-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tip-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  color: #475569;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.tip-controls button:hover {
  background: #f8fafc;
}

.tip-controls button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.custom-tip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.custom-tip input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: right;
}

.final-total-section {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.final-total-section h2 {
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-price {
  color: var(--primary-color);
  font-size: 1.8rem;
}

.round-up-btn {
  background: #f1f5f9;
  color: #475569;
  border: 1px dashed #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.round-up-btn:hover {
  background: #e2e8f0;
}

.checkout-btn {
  width: 100%;
  max-width: 400px;
}

.checkout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.empty-cart {
  text-align: center;
  padding: 3rem;
}

.empty-cart h2 {
  margin-bottom: 1rem;
}

.empty-cart p {
  margin-bottom: 2rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .timer-banner {
    flex-direction: column;
    text-align: center;
  }

  .cart-item {
    grid-template-columns: 80px 1fr auto;
    grid-template-rows: auto auto;
    row-gap: 1rem;
  }
  .item-image {
    grid-row: 1 / 3;
  }
  .item-details {
    grid-column: 2 / 3;
  }
  .item-quantity {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    justify-content: flex-start;
  }
  .item-subtotal {
    grid-column: 3 / 4;
    grid-row: 1 / 2;
    align-self: flex-start;
  }
  .item-remove {
    grid-column: 3 / 4;
    grid-row: 2 / 3;
    align-self: flex-end;
  }

  .cart-summary {
    align-items: stretch;
  }

  .promo-section, .summary-breakdown, .final-total-section {
    max-width: 100%;
  }

  .final-total-section {
    align-items: center;
  }
}
</style>