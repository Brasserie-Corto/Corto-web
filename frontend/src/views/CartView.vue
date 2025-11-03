<script setup lang="ts">
import { useCartStore } from '@/store/cart';

const cartStore = useCartStore();
</script>

<template>
  <div class="cart-page">
    <h1>Your Cart</h1>
    <div v-if="cartStore.items.length > 0" class="cart-content card">
      <div class="cart-items">
        <div v-for="item in cartStore.items" :key="item.beer.id" class="cart-item">
          <img :src="item.beer.imageUrl" :alt="item.beer.name" class="item-image" />
          <div class="item-details">
            <h3>{{ item.beer.name }}</h3>
            <p class="item-price">${{ item.beer.price.toFixed(2) }}</p>
          </div>
          <div class="item-quantity">
            <button @click="cartStore.decreaseQuantity(item.beer.id)" class="quantity-btn">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cartStore.addItem(item.beer)" class="quantity-btn">+</button>
          </div>
          <div class="item-subtotal">
            <p>${{ (item.beer.price * item.quantity).toFixed(2) }}</p>
          </div>
          <div class="item-remove">
            <button @click="cartStore.removeItem(item.beer.id)" class="remove-btn" aria-label="Remove item">
              &times;
            </button>
          </div>
        </div>
      </div>
      <div class="cart-summary">
        <h2>Total: ${{ cartStore.totalPrice }}</h2>
        <button class="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
    <div v-else class="empty-cart card">
      <h2>Your cart is empty.</h2>
      <p>Looks like you haven't added any beers yet. Let's fix that!</p>
      <router-link to="/">
        <button>Continue Shopping</button>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.cart-page h1 {
  text-align: center;
  margin-bottom: 2rem;
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

.item-price {
  color: #6c757d;
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

.cart-summary {
  margin-top: 2rem;
  text-align: right;
  border-top: 2px solid var(--secondary-color);
  padding-top: 2rem;
}

.cart-summary h2 {
  margin-bottom: 1rem;
}

.checkout-btn {
  width: 100%;
  max-width: 300px;
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
}
</style>