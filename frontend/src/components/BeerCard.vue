<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Beer } from '@/types';
import { useCartStore } from '@/store/cart';

interface Props {
  beer: Beer;
}
const props = defineProps<Props>();

const cartStore = useCartStore();
const adding = ref(false);
const added = ref(false);
const errorMsg = ref<string | null>(null);

// Contenant sélectionné (par défaut le premier avec du stock)
const selectedContenantId = ref<number>(
  props.beer.contenants.find(c => c.stock > 0)?.id || props.beer.contenants[0]?.id
);

const selectedContenant = computed(() => 
  props.beer.contenants.find(c => c.id === selectedContenantId.value)
);

const formatVolume = (volume: number) => {
  if (volume >= 1000) return `${volume / 1000}L`;
  return `${volume / 10}cl`;
};

const handleAddToCart = async () => {
  if (!selectedContenant.value || selectedContenant.value.stock <= 0) return;
  
  adding.value = true;
  errorMsg.value = null;
  
  const success = await cartStore.addItem(props.beer, selectedContenantId.value);
  
  if (success) {
    added.value = true;
    setTimeout(() => {
      added.value = false;
    }, 2000);
  } else {
    errorMsg.value = cartStore.error || 'Erreur';
    setTimeout(() => {
      errorMsg.value = null;
    }, 3000);
  }
  
  adding.value = false;
};
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
        <span class="color-tag">{{ beer.color }}</span>
        <span class="price-liter">{{ beer.pricePerLiter.toFixed(2) }}€/L</span>
      </div>
      
      <!-- Sélecteur de contenant -->
      <div class="contenant-selector">
        <label>Format :</label>
        <div class="contenant-options">
          <button 
            v-for="contenant in beer.contenants" 
            :key="contenant.id"
            class="contenant-btn"
            :class="{ 
              'selected': selectedContenantId === contenant.id,
              'out-of-stock': contenant.stock <= 0 
            }"
            :disabled="contenant.stock <= 0"
            @click="selectedContenantId = contenant.id"
          >
            <span class="volume">{{ formatVolume(contenant.volume) }}</span>
            <span class="contenant-price">{{ contenant.price.toFixed(2) }}€</span>
            <span v-if="contenant.stock <= 0" class="no-stock">Épuisé</span>
            <span v-else class="stock-count">{{ contenant.stock }} dispo</span>
          </button>
        </div>
      </div>

      <p v-if="selectedContenant" class="selected-price">
        {{ selectedContenant.price.toFixed(2) }}€
      </p>
      
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      
      <button 
        @click="handleAddToCart" 
        :disabled="!selectedContenant || selectedContenant.stock <= 0 || adding"
        :class="{ 'added': added }"
        class="add-btn"
      >
        <template v-if="adding">Ajout...</template>
        <template v-else-if="added">✓ Ajouté !</template>
        <template v-else>Ajouter au panier</template>
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
  z-index: 1;
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
  padding: 0 0.5rem;
}

.beer-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.beer-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-tag {
  background: var(--secondary-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.price-liter {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.contenant-selector {
  margin-bottom: 1rem;
}

.contenant-selector label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.contenant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.contenant-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.contenant-btn:hover:not(:disabled) {
  border-color: var(--secondary-color);
}

.contenant-btn.selected {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
}

.contenant-btn.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.contenant-btn .volume {
  font-weight: bold;
  font-size: 1rem;
  color: #333;
}

.contenant-btn .contenant-price {
  font-size: 0.85rem;
  color: var(--primary-color);
  font-weight: 500;
}

.contenant-btn .stock-count {
  font-size: 0.7rem;
  color: #28a745;
}

.contenant-btn .no-stock {
  font-size: 0.7rem;
  color: #dc3545;
}

.selected-price {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0.5rem 0 1rem;
}

.error-msg {
  color: #dc3545;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.add-btn {
  width: 100%;
  margin-top: auto;
  transition: all 0.2s;
}

.add-btn.added {
  background-color: #28a745;
}

.add-btn:disabled {
  opacity: 0.7;
}
</style>
