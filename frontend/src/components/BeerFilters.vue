
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getBeerColors, maxPrice } from '@/data/beers';

const beerColors = ref<string[]>([]);
onMounted(async () => {
  // load colors available currently
  beerColors.value = await getBeerColors();
});

const filters = defineModel('filters');
</script>

<template>
  <aside class="filters-sidebar card">
    <h3>Filters</h3>
    <div class="filter-group">
      <label for="price-range">Max Price: ${{ filters.price }}</label>
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
      <h4>Color</h4>
      <div v-for="color in beerColors" :key="color" class="checkbox-group">
        <input type="checkbox" :id="color" :value="color" v-model="filters.colors" />
        <label :for="color">{{ color }}</label>
      </div>
    </div>
    
    <div class="filter-group">
      <h4>Stock</h4>
      <div class="radio-group">
        <input type="radio" id="all" value="all" v-model="filters.stock" />
        <label for="all">All</label>
      </div>
       <div class="radio-group">
        <input type="radio" id="in-stock" value="inStock" v-model="filters.stock" />
        <label for="in-stock">In Stock</label>
      </div>
       <div class="radio-group">
        <input type="radio" id="out-of-stock" value="outOfStock" v-model="filters.stock" />
        <label for="out-of-stock">Out of Stock</label>
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
