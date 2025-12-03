<script setup lang="ts">
import type { Beer } from '@/types';
import { useCartStore } from '@/store/cart';

interface Props {
  beer: Beer;
}
defineProps<Props>();

const cartStore = useCartStore();
</script>

<template>
  <div class="beer-card card">
    <div class="stock-badge" :class="{ 'out-of-stock': !beer.inStock }">
      {{ beer.inStock ? 'En stock' : 'Rupture' }}
    </div>
    <img :src="beer.imageUrl" :alt="beer.name" class="beer-image" />
    <div class="beer-info">
      <h3>{{ beer.name }}</h3>
      <div class="beer-meta">
        <span>{{ beer.type }}</span>
        <span aria-hidden="true">|</span>
        <span>{{ beer.color }}</span>
      </div>
      <p class="beer-price">{{ beer.price.toFixed(2) }}€</p>
      <button @click="cartStore.addItem(beer)" :disabled="!beer.inStock">
        Ajouter au panier
      </button>
    </div>
  </div>
</template>

<style scoped>
.beer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: center;
  overflow: hidden;
}

.stock-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.stock-badge.out-of-stock {
  background-color: #dc3545;
}

.beer-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  margin-bottom: 1rem;
}

.beer-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.beer-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.beer-meta {
  color: #6c757d;
  margin-bottom: 1rem;
}

.beer-meta span {
  margin: 0 0.25rem;
}

.beer-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.beer-info button {
  width: 100%;
  margin-top: auto;
}
</style>
