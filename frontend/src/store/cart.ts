import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Beer } from '@/types';

interface CartItem {
  beer: Beer;
  quantity: number;
}

const STORAGE_KEY = 'corto-cart-items';

export const useCartStore = defineStore('cart', () => {
  // Load initial state from localStorage
  const getInitialItems = (): CartItem[] => {
    const storedItems = localStorage.getItem(STORAGE_KEY);
    if (storedItems) {
      try {
        return JSON.parse(storedItems);
      } catch (e) {
        console.error('Failed to parse cart items from localStorage', e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return [];
  };

  const items = ref<CartItem[]>(getInitialItems());

  // Watch for changes in items and save to localStorage
  watch(
    items,
    (newItems) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    },
    { deep: true } // Use deep watch to detect changes in item quantity
  );

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0);
  });
  
  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + item.beer.price * item.quantity, 0).toFixed(2);
  });

  function addItem(beer: Beer) {
    const existingItem = items.value.find(item => item.beer.id === beer.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      items.value.push({ beer, quantity: 1 });
    }
  }

  function decreaseQuantity(beerId: number) {
    const existingItem = items.value.find(item => item.beer.id === beerId);
    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity--;
      } else {
        removeItem(beerId);
      }
    }
  }

  function removeItem(beerId: number) {
    items.value = items.value.filter(item => item.beer.id !== beerId);
  }

  return { items, totalItems, totalPrice, addItem, decreaseQuantity, removeItem };
});
