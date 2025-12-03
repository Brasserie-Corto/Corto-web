<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BeerCard from '@/components/BeerCard.vue';
import BeerFilters from '@/components/BeerFilters.vue';
import { API_URL } from '@/config/api';
import type { Beer } from '@/types';

const beers = ref<Beer[]>([]);

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/beers`);
    if (!response.ok) throw new Error('Failed to fetch beers');
    beers.value = await response.json();
  } catch (error) {
    console.error('Erreur:', error);
  }
});
const filters = ref({
  price: 20,
  types: [],
  colors: [],
  stock: 'all', 
});

const filteredBeers = computed(() => {
  return beers.value.filter((beer: Beer) => {
    // Price filter (basé sur le prix au litre)
    const priceMatch = beer.pricePerLiter <= filters.value.price;

    // Type filter
    // @ts-ignore
    const typeMatch = filters.value.types.length === 0 || filters.value.types.includes(beer.type);

    // Color filter
    // @ts-ignore
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
      <div v-if="beers.length === 0" class="no-results card">
        <h3>Aucune bière trouvée</h3>
        <p>Essayez d'ajuster vos filtres pour trouver votre bière idéale !</p>
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
