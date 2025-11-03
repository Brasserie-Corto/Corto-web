<script setup lang="ts">
import { ref, computed } from 'vue';
import { beers, maxPrice } from '@/data/beers';
import BeerCard from '@/components/BeerCard.vue';
import BeerFilters from '@/components/BeerFilters.vue';
import type { Beer } from '@/types';

const filters = ref({
  price: maxPrice,
  types: [],
  colors: [],
  stock: 'all', // 'all', 'inStock', 'outOfStock'
});

const filteredBeers = computed(() => {
  return beers.filter((beer: Beer) => {
    // Price filter
    const priceMatch = beer.price <= filters.value.price;

    // Type filter
    const typeMatch = filters.value.types.length === 0 || filters.value.types.includes(beer.type);

    // Color filter
    const colorMatch = filters.value.colors.length === 0 || filters.value.colors.includes(beer.color);
    
    // Stock filter
    const stockMatch = filters.value.stock === 'all' || 
                       (filters.value.stock === 'inStock' && beer.inStock) ||
                       (filters.value.stock === 'outOfStock' && !beer.inStock);

    return priceMatch && typeMatch && colorMatch && stockMatch;
  });
});
</script>

<template>
  <div class="shop-layout">
    <BeerFilters v-model:filters="filters" />
    <div class="beer-grid">
      <BeerCard v-for="beer in filteredBeers" :key="beer.id" :beer="beer" />
      <div v-if="filteredBeers.length === 0" class="no-results card">
        <h3>No Beers Found</h3>
        <p>Try adjusting your filters to find your perfect brew!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

.beer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
}

@media (max-width: 992px) {
  .shop-layout {
    grid-template-columns: 1fr;
  }
  .filters-sidebar {
    position: static;
    margin-bottom: 2rem;
  }
}
</style>
