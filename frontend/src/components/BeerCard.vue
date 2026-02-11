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
const quantities = ref<Record<number, number>>({});

// Initialisation
props.beer.contenants.forEach(c => {
  quantities.value[c.id] = 1;
});

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

const getQty = (id: number) => quantities.value[id] || 1;

// Mise à jour via les boutons + / -
const updateQty = (id: number, delta: number) => {
  selectedContenantId.value = id;
  const current = getQty(id);
  const max = props.beer.contenants.find(c => c.id === id)?.stock || 0;
  const newVal = current + delta;
  if (newVal >= 1 && newVal <= max) quantities.value[id] = newVal;
};

// Mise à jour via l'input clavier
const onInputQty = (id: number, event: Event) => {
  selectedContenantId.value = id;
  const target = event.target as HTMLInputElement;
  let val = parseInt(target.value);
  const max = props.beer.contenants.find(c => c.id === id)?.stock || 0;

  // Validation
  if (isNaN(val) || val < 1) val = 1;
  if (val > max) val = max;

  quantities.value[id] = val;

  // Force l'affichage à jour si on a dépassé les bornes
  target.value = val.toString();
};

// Gestion des couleurs de bière
const getColorStyle = (colorName: string) => {
  const colors: Record<string, string> = {
    'blonde': '#f1c40f', // Jaune doré
    'ambrée': '#e67e22', // Orange foncé
    'brune': '#795548',  // Marron
    'noire': '#212121',  // Noir (Stout)
    'blanche': '#f5f5dc', // Beige clair
    'rouge': '#c0392b'   // Rouge
  };

  const key = colorName.toLowerCase();
  const bg = colors[key] || '#95a5a6';
  const text = ['blonde', 'blanche'].includes(key) ? '#333' : '#fff';

  return { backgroundColor: bg, color: text, borderColor: bg };
};

const handleAddToCart = async () => {
  if (!selectedContenant.value || selectedContenant.value.stock <= 0) return;
  
  adding.value = true;
  errorMsg.value = null;
  const success = await cartStore.addItem(props.beer, selectedContenantId.value, getQty(selectedContenantId.value));
  if (success) {
    added.value = true;
    quantities.value[selectedContenantId.value] = 1;
    setTimeout(() => added.value = false, 2000);
  } else {
    errorMsg.value = cartStore.error;
    setTimeout(() => errorMsg.value = null, 3000);
  }
  adding.value = false;
};
</script>

<template>
  <div class="beer-card card">
  <div class="beer-image-container">
    <div class="stock-badge" :class="{ 'out-of-stock': !beer.inStock }">
      {{ beer.inStock ? 'En stock' : 'Rupture' }}
    </div>
    <img :src="beer.imageUrl" :alt="beer.name" class="beer-image" />
  </div>
    <div class="beer-info">
      <h3>{{ beer.name }}</h3>
      <div class="beer-meta">
        <span class="color-tag" :style="getColorStyle(beer.color)">
          {{ beer.color }}
        </span>
        <span class="price-liter">{{ beer.pricePerLiter.toFixed(2) }}€/L</span>
      </div>
      
      <!-- Sélecteur de contenant -->
      <div class="contenant-selector">
        <div class="contenant-label">Format :</div>
        <div class="contenant-options">
          <div
            v-for="c in beer.contenants"
            :key="c.id"
            class="contenant-btn"
            :class="{
              selected: selectedContenantId === c.id,
              'out-of-stock': c.stock === 0
            }"
              @click="c.stock > 0 ? selectedContenantId = c.id : null"
          >
          <div class="contenant-header">
            <span class="volume">{{ formatVolume(c.volume) }}</span>
            <span class="contenant-price">{{ c.price.toFixed(2) }}€</span>
            </div>

            <div v-if="c.stock > 0" class="stock-info">
              {{ c.stock }} dispo
            </div>

            <div class="mini-qty-selector" v-if="c.stock > 0">
              <button
                  class="qty-mini-btn minus"
                  @click.stop="updateQty(c.id, -1)"
                  :disabled="getQty(c.id) <= 1"
              >-</button>

              <input
                  type="number"
                  class="qty-input"
                  :value="getQty(c.id)"
                  @click.stop
                  @input="(e) => onInputQty(c.id, e)"
                  min="1"
                  :max="c.stock"
              />

              <button
                  class="qty-mini-btn plus"
                  @click.stop="updateQty(c.id, 1)"
                  :disabled="getQty(c.id) >= c.stock"
              >+</button>
            </div>

            <div v-else class="rupture-label">Épuisé</div>
          </div>
        </div>
      </div>

      <div class="action-footer">
        <div v-if="selectedContenant && selectedContenant.stock > 0" class="price-display">
        {{ (selectedContenant.price * getQty(selectedContenantId)).toFixed(2) }}€
      </div>

      <button
            v-if="selectedContenant && selectedContenant.stock > 0"
            class="add-btn"
        @click="handleAddToCart"
        :disabled="adding"
        :class="{ success: added }"
        >
          {{ added ? 'Ajouté !' : (adding ? '...' : 'Ajouter au panier') }}
        </button>

        <div v-else-if="selectedContenant" class="rupture-text">
          Rupture de stock
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.beer-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  transition: transform 0.2s;
  background: white;
  text-align: center;
  font-size: 0.9rem;
}

.beer-card:hover {
  transform: translateY(-4px);
}

.beer-image-container {
  height: 250px;
  position: relative;
  background-color: #f9f9f9;
  margin: 0.5rem;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.beer-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  padding: 8px;
  border-radius: 12px;
}

.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stock-badge.out-of-stock {
  background-color: #dc3545;
}

.out-of-stock-badge {
  display: none;
}

.beer-info {
  padding: 0.5rem 1rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.beer-info h3 {
  font-size: 1.2rem;
  margin-bottom: 0.4rem;
  width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
  min-height: 2.4em;
}

.beer-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
  flex-wrap: wrap;
}

.color-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  border: 1px solid transparent;
}

.price-liter {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}

.contenant-selector {
  margin-bottom: 1rem;
  width: 100%;
}

.contenant-label {
  font-weight: 600;
  color: #666;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
}

.contenant-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  width: 100%;
}

.contenant-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 90px;
}

.contenant-btn:hover {
  border-color: var(--secondary-color);
}

.contenant-btn.selected {
  border-color: var(--primary-color);
  background: rgba(216, 161, 82, 0.08);
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

.contenant-btn.out-of-stock {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8f9fa;
  border-color: #eee;
}

.contenant-header {
  margin-bottom: 0.2rem;
  line-height: 1.1;
  width: 100%;
}

.contenant-btn .volume {
  display: block;
  font-weight: 800;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 2px;
}

.contenant-btn .contenant-price {
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 700;
}

.stock-info {
  font-size: 0.7rem;
  color: #28a745;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.mini-qty-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
  max-width: 100px;
  height: 28px;
  margin-top: auto;
}

.qty-mini-btn {
  border: none;
  background: #f0f0f0;
  color: #333;
  width: 26px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
  padding: 0;
  flex-shrink: 0;
}

.qty-mini-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.qty-mini-btn:disabled {
  opacity: 0.5;
  cursor: default;
  color: #999;
}

.qty-mini-btn.minus {
  border-right: 1px solid #ddd;
}
.qty-mini-btn.plus {
  border-left: 1px solid #ddd;
}
.qty-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: none;
  text-align: center;
  font-size: 0.95rem;
  font-weight: bold;
  padding: 0;
  height: 100%;
  color: #333;
  appearance: textfield;
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-input:focus {
  outline: none;
  background-color: #fff8e1;
}

.rupture-label {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: bold;
  margin-top: auto;
  margin-bottom: auto;
}

.action-footer {
  margin-top: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.price-display {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-color);
}

.add-btn {
  width: 100%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.add-btn:hover:not(:disabled) {
  background-color: #b07d10;
}

.add-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.add-btn.success {
  background-color: #10b981;
}

.rupture-text {
  color: #dc3545;
  font-weight: 500;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.error-msg {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
</style>