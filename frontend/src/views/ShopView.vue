<script setup lang="ts">

import { ref, computed, onMounted, onUnmounted } from 'vue';
import BeerCard from '@/components/BeerCard.vue';
import BeerFilters from '@/components/BeerFilters.vue';
import { API_URL } from '@/config/api';
import type { Beer } from '@/types';

// Filtres, price sera mis à jour après le fetch
const filters = ref({
  price: 0,
  types: [],
  colors: [],
  stock: 'all',
});

// Met à jour le filtre price avec le max pricePerLiter des bières
const updatePriceFilterToMax = () => {
  if (beers.value.length > 0) {
    const maxPrice = Math.max(...beers.value.map(b => b.pricePerLiter));
    filters.value.price = maxPrice;
  }
};


const beers = ref<Beer[]>([]);
let ws: WebSocket | null = null;

const fetchBeers = async () => {
  try {
    const response = await fetch(`${API_URL}/beers`);
    if (!response.ok) throw new Error('Failed to fetch beers');
    beers.value = await response.json();
    updatePriceFilterToMax();
  } catch (error) {
    console.error('Erreur:', error);
  }
};

const connectWebSocket = () => {
  // Déduire l'URL WebSocket depuis API_URL
  const wsUrl = API_URL.replace('http', 'ws');
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connecté pour le stock temps réel');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'STOCK_UPDATE') {
        // Rafraîchir les bières quand le stock change
        fetchBeers();
      }
    } catch (error) {
      console.error('Erreur WebSocket:', error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket déconnecté, reconnexion dans 5s...');
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('Erreur WebSocket:', error);
  };
};

onMounted(() => {
  fetchBeers();
  connectWebSocket();
});

onUnmounted(() => {
  if (ws) {
    ws.close();
    ws = null;
  }
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
