
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { API_URL } from '@/config/api';

interface Filters {
  price: number;
  types: string[];
  colors: string[];
  stock: string;
}

const beerColors = ref<string[]>([]);
const maxPrice = ref(20);

onMounted(async () => {
  try {
    const [colorsRes, priceRes] = await Promise.all([
      fetch(`${API_URL}/beer-colors`),
      fetch(`${API_URL}/max-price`)
    ]);
    
    if (colorsRes.ok) {
      beerColors.value = await colorsRes.json();
    }
    if (priceRes.ok) {
      const data = await priceRes.json();
      maxPrice.value = data.maxPrice;
    }
  } catch (error) {
    console.error('Error loading filter data:', error);
  }
});

const filters = defineModel<Filters>('filters', { required: true });
</script>

<template>
  <aside class="filters-sidebar card">
    <h3>Filtres</h3>
    <div class="filter-group">
      <label for="price-range">Prix max : {{ filters.price }}€</label>
      <input 
        type="range" 
        id="price-range" 
        min="0" 
        :max="maxPrice" 
        step="0.5"
        v-model.number="filters.price" 
      />
    </div>
    
    <div class="filter-group">
      <h4>Couleur</h4>
      <div v-for="color in beerColors" :key="color" class="checkbox-group">
        <input type="checkbox" :id="color" :value="color" v-model="filters.colors" />
        <label :for="color">{{ color }}</label>
      </div>
    </div>
    
    <div class="filter-group">
      <h4>Stock</h4>
      <div class="radio-group">
        <input type="radio" id="all" value="all" v-model="filters.stock" />
        <label for="all">Tout</label>
      </div>
       <div class="radio-group">
        <input type="radio" id="in-stock" value="inStock" v-model="filters.stock" />
        <label for="in-stock">En stock</label>
      </div>
       <div class="radio-group">
        <input type="radio" id="out-of-stock" value="outOfStock" v-model="filters.stock" />
        <label for="out-of-stock">Rupture</label>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.filters-sidebar {
  padding: 1.5rem;
  position: sticky;
  top: 100px;
}

.filter-group {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
}
.filter-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.filter-group h4 {
  margin-bottom: 1rem;
}

input[type="range"] {
  width: 100%;
}

.checkbox-group, .radio-group {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.checkbox-group label, .radio-group label {
  margin-bottom: 0;
  margin-left: 0.5rem;
  font-weight: normal;
}
</style>
