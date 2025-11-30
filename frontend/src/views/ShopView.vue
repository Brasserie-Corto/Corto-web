<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BeerCard from '@/components/BeerCard.vue';
import BeerFilters from '@/components/BeerFilters.vue';
import type { Beer } from '@/types';
import { createClient } from '@supabase/supabase-js'

// 1. Initialisation du client Supabase
// Note: Idéalement, mets ces clés dans un fichier .env (voir note en bas)
const supabase = createClient(
  "http://localhost:8000", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

const beers = ref<Beer[]>([]); 

onMounted(async () => {
  const { data, error } = await supabase
    .from('detailed_recipes') 
    .select('*');

  if (error) {
    console.error('Erreur:', error);
  } else if (data) {
    beers.value = data.map((beer: any) => {
      
      const { data: imageData } = supabase
        .storage
        .from('beers')
        .getPublicUrl(`images/main/${beer.id}.png`);

      return {
        ...beer,
        imageUrl: imageData.publicUrl,
        // On s'assure que quantity est un nombre (au cas où ce soit null)
        total_quantity: beer.total_quantity || 0,
        // On recrée le booléen pour le composant BeerCard ! IMPORTANT
        inStock: (beer.total_quantity || 0) > 0 
      };
    });
  }
});

console.log(beers);
const filters = ref({
  price: 20,
  types: [],
  colors: [],
  stock: 'all', 
});

const filteredBeers = computed(() => {
  // 4. IMPORTANT : Utiliser beers.value ici car c'est une Ref maintenant
  return beers.value.filter((beer: Beer) => {
    // Price filter
    const priceMatch = beer.price <= filters.value.price;

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
