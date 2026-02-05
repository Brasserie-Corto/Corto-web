<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cart';

const cartStore = useCartStore();
const router = useRouter();
const now = ref(new Date());
let timerInterval: number | null = null;
const customTotal = ref(0);

onMounted(async () => {
  await cartStore.fetchCart();
  // Init customTotal with store value
  customTotal.value = parseFloat(cartStore.totalPrice);

  timerInterval = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Watch for price changes from store
watch(() => cartStore.totalPrice, (newVal) => {
  const val = parseFloat(newVal);
  if (!isNaN(val)) {
    customTotal.value = val;
  }
});

// Computed countdown
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

const initialTotal = computed(() => parseFloat(cartStore.totalPrice));

const isModified = computed(() => {
  return customTotal.value > initialTotal.value;
});

const canRoundUp = computed(() => {
  // Show round up button only if decimal part exists
  return customTotal.value % 1 !== 0;
});

const roundUpDiff = computed(() => {
  if (!canRoundUp.value) return 0;
  const nextInt = Math.ceil(customTotal.value);
  return (nextInt - customTotal.value).toFixed(2);
});

const handleRoundUp = () => {
  customTotal.value = Math.ceil(customTotal.value);
};

const handleIncrement = () => {
  customTotal.value += 1;
};

const handleDecrement = () => {
  if (customTotal.value - 1 >= initialTotal.value) {
    customTotal.value -= 1;
  } else {
    customTotal.value = initialTotal.value;
  }
};

const validateInput = () => {
  if (
      typeof customTotal.value !== 'number' ||
      isNaN(customTotal.value) ||
      customTotal.value < initialTotal.value
  ) {
    customTotal.value = initialTotal.value;
  }
};

const handleCheckout = async () => {
  const order = await cartStore.checkout(customTotal.value);
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
        <h2>Total à payer</h2>

        <div class="price-editor">
          <button
              v-if="canRoundUp"
              @click="handleRoundUp"
              class="round-up-btn"
          >
            Arrondir (+{{ roundUpDiff }}€)
          </button>

          <div class="price-input-wrapper">
            <input
                type="number"
                v-model.number="customTotal"
                @change="validateInput"
                @blur="validateInput"
                :min="initialTotal"
                step="0.01"
                class="price-input"
            />
            <div class="price-controls">
              <button @click="handleIncrement" class="control-btn up">▲</button>
              <button @click="handleDecrement" class="control-btn down">▼</button>
            </div>
            <span class="currency">€</span>
          </div>
        </div>

        <p v-if="isModified" class="initial-price-info">
          Prix initial : {{ initialTotal.toFixed(2) }}€
        </p>

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

.cart-summary h2 {
  margin-bottom: 1rem;
}

.price-editor {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  justify-content: flex-end;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 50px;
}

.price-input {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0 1rem;
  width: 120px;
  text-align: right;
  border: 2px solid var(--border-color);
  border-right: none;
  border-radius: 6px 0 0 6px;
  color: var(--primary-color);
  background: white;
  height: 100%;
}

.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.price-input[type=number] {
  -moz-appearance: textfield;
}

.price-controls {
  display: flex;
  flex-direction: column;
  width: 40px;
}

.control-btn {
  flex: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  border: 2px solid var(--border-color);
  background: #f1f3f5;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
}

.control-btn.up {
  border-radius: 0 6px 0 0;
  border-bottom: 1px solid var(--border-color);
}

.control-btn.down {
  border-radius: 0 0 6px 0;
  border-top: none;
}

.control-btn:hover {
  background: #e9ecef;
  color: var(--primary-color);
}

.control-btn:active {
  background: #dee2e6;
}

.currency {
  font-size: 1.5rem;
  font-weight: bold;
  margin-left: 0.75rem;
  color: var(--text-color);
  align-self: center;
}

.initial-price-info {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.checkout-btn {
  width: 100%;
  max-width: 300px;
  margin-top: 1rem;
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

  .price-editor {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .round-up-btn {
    padding: 0.75rem 1rem;
  }
}
</style>