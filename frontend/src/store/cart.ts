import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import { API_URL } from '@/config/api';
import type { CartItem, Beer } from '@/types';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const expiresAt = ref<Date | null>(null);

  const authStore = useAuthStore();

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0);
  });

  const totalPrice = computed(() => {
    return items.value
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  });

  const timeRemaining = computed(() => {
    if (!expiresAt.value) return null;
    const now = new Date();
    const diff = expiresAt.value.getTime() - now.getTime();
    if (diff <= 0) return null;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, total: diff };
  });

  // Fetch cart from backend
  async function fetchCart() {
    const clientId = authStore.user?.clientId;
    if (!clientId) return;

    try {
      loading.value = true;
      const response = await fetch(`${API_URL}/cart/${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      
      const data = await response.json();
      items.value = data;
      
      // Set expiration from first item (all should have same expiration)
      if (data.length > 0) {
        expiresAt.value = new Date(data[0].expires_at);
      } else {
        expiresAt.value = null;
      }
    } catch (err: any) {
      error.value = err.message;
      console.error('Error fetching cart:', err);
    } finally {
      loading.value = false;
    }
  }

  // Add item to cart (creates reservation)
  async function addItem(beer: Beer, contenantId: number, quantity: number = 1) {
    const clientId = authStore.user?.clientId;
    if (!clientId) {
      error.value = 'Vous devez être connecté';
      return false;
    }

    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_URL}/cart/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          recipeId: beer.id,
          conteningId: contenantId,
          quantity: quantity,
        }),
      });

      // Handle non-JSON responses (e.g., server errors)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        error.value = 'Erreur serveur - veuillez réessayer';
        return false;
      }

      const data = await response.json();

      if (!response.ok) {
        error.value = data.error || 'Erreur lors de l\'ajout';
        return false;
      }

      expiresAt.value = new Date(data.expiresAt);
      await fetchCart();
      return true;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error adding to cart:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Update item quantity
  async function updateQuantity(reservationId: number, quantity: number) {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_URL}/cart/reservation/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        error.value = data.error || 'Erreur lors de la mise à jour';
        return false;
      }

      await fetchCart();
      return true;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error updating quantity:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Increase quantity
  async function increaseQuantity(reservationId: number) {
    const item = items.value.find(i => i.id === reservationId);
    if (item) {
      return updateQuantity(reservationId, item.quantity + 1);
    }
  }

  // Decrease quantity
  async function decreaseQuantity(reservationId: number) {
    const item = items.value.find(i => i.id === reservationId);
    if (item) {
      if (item.quantity > 1) {
        return updateQuantity(reservationId, item.quantity - 1);
      } else {
        return removeItem(reservationId);
      }
    }
  }

  // Remove item from cart
  async function removeItem(reservationId: number) {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_URL}/cart/reservation/${reservationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        error.value = data.error || 'Erreur lors de la suppression';
        return false;
      }

      await fetchCart();
      return true;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error removing item:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Clear cart
  async function clearCart() {
    const clientId = authStore.user?.clientId;
    if (!clientId) return;

    try {
      loading.value = true;
      await fetch(`${API_URL}/cart/${clientId}`, { method: 'DELETE' });
      items.value = [];
      expiresAt.value = null;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error clearing cart:', err);
    } finally {
      loading.value = false;
    }
  }

  // Extend reservation time
  async function extendTime() {
    const clientId = authStore.user?.clientId;
    if (!clientId) return;

    try {
      const response = await fetch(`${API_URL}/cart/extend/${clientId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        expiresAt.value = new Date(data.expiresAt);
      }
    } catch (err: any) {
      console.error('Error extending time:', err);
    }
  }

  // Checkout - create order
  async function checkout() {
    const clientId = authStore.user?.clientId;
    if (!clientId) {
      error.value = 'Vous devez être connecté';
      return null;
    }

    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        error.value = data.error || 'Erreur lors de la commande';
        return null;
      }

      // Clear local cart
      items.value = [];
      expiresAt.value = null;

      return data.order;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error during checkout:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    error,
    expiresAt,
    totalItems,
    totalPrice,
    timeRemaining,
    fetchCart,
    addItem,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    extendTime,
    checkout,
  };
});
