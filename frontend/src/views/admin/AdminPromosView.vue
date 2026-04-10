<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth.ts';
import { supabase } from '@/config/supabase.ts';
import AdminMenu from '@/components/admin/AdminMenu.vue';
import type { Promotion } from '@/types';
import { TicketPercent, Plus, History, Check, X } from 'lucide-vue-next';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'admin');

const promotions = ref<Promotion[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const showForm = ref(false);
const submitting = ref(false);

const formData = ref({
  code: '',
  type: 'percentage' as 'percentage' | 'fixed_conditional' | 'fixed',
  value: 0,
  min_amount: 0,
  start_date: '',
  end_date: '',
  max_uses: null as number | null,
});

const selectedPromoId = ref<number | null>(null);
const promoHistory = ref<any[]>([]);
const historyLoading = ref(false);

const fetchPromotions = async () => {
  try {
    loading.value = true;
    error.value = null;
    const { data, error: fetchError } = await supabase
        .from('promotion')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    promotions.value = data || [];
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch promotions';
  } finally {
    loading.value = false;
  }
};

const createPromotion = async () => {
  try {
    submitting.value = true;
    const payload = {
      code: formData.value.code.toUpperCase(),
      type: formData.value.type,
      value: formData.value.value,
      min_amount: formData.value.min_amount,
      start_date: formData.value.start_date || null,
      end_date: formData.value.end_date || null,
      max_uses: formData.value.max_uses || null,
      is_active: true,
      current_uses: 0
    };

    const { error: insertError } = await supabase
        .from('promotion')
        .insert([payload]);

    if (insertError) throw insertError;

    showForm.value = false;
    formData.value = {
      code: '',
      type: 'percentage',
      value: 0,
      min_amount: 0,
      start_date: '',
      end_date: '',
      max_uses: null,
    };
    await fetchPromotions();
  } catch (err: any) {
    alert(err.message || 'Error creating promotion');
  } finally {
    submitting.value = false;
  }
};

const togglePromotionStatus = async (id: number, currentStatus: boolean) => {
  try {
    const { error: updateError } = await supabase
        .from('promotion')
        .update({ is_active: !currentStatus })
        .eq('id', id);

    if (updateError) throw updateError;
    await fetchPromotions();
  } catch (err: any) {
    alert(err.message || 'Error updating promotion status');
  }
};

const fetchHistory = async (id: number) => {
  if (selectedPromoId.value === id) {
    selectedPromoId.value = null;
    return;
  }

  try {
    selectedPromoId.value = id;
    historyLoading.value = true;

    const { data, error: fetchError } = await supabase
        .from('command')
        .select('id, amount, initial_amount, discount_amount, order_date, client(name, lastname)')
        .eq('id_promotion', id)
        .order('order_date', { ascending: false });

    if (fetchError) throw fetchError;
    promoHistory.value = data || [];
  } catch (err: any) {
    alert(err.message || 'Error fetching history');
  } finally {
    historyLoading.value = false;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatValue = (type: string, value: number) => {
  if (type === 'percentage') return `${value}%`;
  return `${value}€`;
};

onMounted(() => {
  if (isAdmin.value) {
    fetchPromotions();
  }
});
</script>

<template>
  <div class="admin-promos">
    <div v-if="!isAdmin" class="error-message">Accès refusé.</div>
    <template v-else>
      <AdminMenu />

      <div class="header-actions">
        <h2>Codes Promotionnels</h2>
        <button @click="showForm = !showForm" class="btn-create">
          <Plus :size="16" />
          Nouveau code
        </button>
      </div>

      <div v-if="showForm" class="card form-card">
        <h3>Créer un code promotionnel</h3>
        <form @submit.prevent="createPromotion">
          <div class="form-row">
            <div class="form-group">
              <label>Code</label>
              <input v-model="formData.code" type="text" required placeholder="SUMMER2024" style="text-transform: uppercase;" />
            </div>
            <div class="form-group">
              <label>Type de réduction</label>
              <select v-model="formData.type">
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Valeur</label>
              <input v-model.number="formData.value" type="number" required min="0" step="0.1" />
            </div>
            <div class="form-group">
              <label>Montant minimum de commande (€)</label>
              <input v-model.number="formData.min_amount" type="number" min="0" step="0.1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date de début (Optionnel)</label>
              <input v-model="formData.start_date" type="datetime-local" />
            </div>
            <div class="form-group">
              <label>Date de fin (Optionnel)</label>
              <input v-model="formData.end_date" type="datetime-local" />
            </div>
          </div>
          <div class="form-group">
            <label>Nombre maximum d'utilisations (Optionnel)</label>
            <input v-model.number="formData.max_uses" type="number" min="1" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showForm = false">Annuler</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Création...' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="loading" class="loading">Chargement...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else class="promos-list">
        <div v-if="promotions.length === 0" class="no-data">Aucun code promo configuré.</div>

        <div v-for="promo in promotions" :key="promo.id" class="promo-card card" :class="{ 'inactive': !promo.is_active }">
          <div class="promo-header">
            <div class="promo-identity">
              <TicketPercent :size="20" class="promo-icon" />
              <span class="promo-code">{{ promo.code }}</span>
              <span class="promo-badge" :class="promo.is_active ? 'active' : 'disabled'">
                {{ promo.is_active ? 'Actif' : 'Désactivé' }}
              </span>
            </div>
            <div class="promo-actions">
              <button @click="fetchHistory(promo.id)" class="btn-icon" title="Historique">
                <History :size="18" />
              </button>
              <button @click="togglePromotionStatus(promo.id, promo.is_active)" class="btn-icon" :class="promo.is_active ? 'danger' : 'success'" :title="promo.is_active ? 'Désactiver' : 'Activer'">
                <component :is="promo.is_active ? X : Check" :size="18" />
              </button>
            </div>
          </div>

          <div class="promo-details">
            <div class="detail-item">
              <span class="label">Réduction :</span>
              <span class="value">{{ formatValue(promo.type, promo.value) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Min. achat :</span>
              <span class="value">{{ promo.min_amount }}€</span>
            </div>
            <div class="detail-item">
              <span class="label">Utilisations :</span>
              <span class="value">{{ promo.current_uses }} / {{ promo.max_uses || '∞' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Validité :</span>
              <span class="value">{{ formatDate(promo.start_date) }} - {{ formatDate(promo.end_date) }}</span>
            </div>
          </div>

          <div v-if="selectedPromoId === promo.id" class="history-section">
            <h4>Historique d'utilisation</h4>
            <div v-if="historyLoading" class="loading-mini">Chargement de l'historique...</div>
            <div v-else-if="promoHistory.length === 0" class="no-data-mini">Aucune utilisation enregistrée.</div>
            <table v-else class="history-table">
              <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Cmd #</th>
                <th>Initiale</th>
                <th>Réduction</th>
                <th>Finale</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="entry in promoHistory" :key="entry.id">
                <td>{{ formatDate(entry.order_date) }}</td>
                <td>{{ entry.client?.name }} {{ entry.client?.lastname }}</td>
                <td>#{{ entry.id }}</td>
                <td>{{ entry.initial_amount }}€</td>
                <td class="discount-col">-{{ entry.discount_amount }}€</td>
                <td>{{ entry.amount }}€</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-promos {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #10b981;
}

.btn-create:hover {
  background-color: #059669;
}

.form-card {
  margin-bottom: 2rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  background: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancel {
  background-color: #64748b;
}

.btn-submit {
  background-color: var(--primary-color);
}

.promos-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.promo-card {
  padding: 1.5rem;
  border-left: 4px solid #10b981;
  transition: all 0.2s;
}

.promo-card.inactive {
  border-left-color: #94a3b8;
  opacity: 0.8;
}

.promo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.promo-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.promo-icon {
  color: var(--primary-color);
}

.promo-code {
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.promo-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
}

.promo-badge.active {
  background: #d1fae5;
  color: #059669;
}

.promo-badge.disabled {
  background: #f1f5f9;
  color: #64748b;
}

.promo-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #475569;
}

.btn-icon:hover {
  background: #e2e8f0;
}

.btn-icon.danger {
  color: #ef4444;
}
.btn-icon.danger:hover {
  background: #fee2e2;
}

.btn-icon.success {
  color: #10b981;
}
.btn-icon.success:hover {
  background: #d1fae5;
}

.promo-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item .label {
  font-size: 0.85rem;
  color: #64748b;
}

.detail-item .value {
  font-weight: 600;
  color: #334155;
}

.history-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #cbd5e1;
}

.history-section h4 {
  margin-bottom: 1rem;
  color: #475569;
  font-size: 1rem;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.history-table th, .history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.history-table th {
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
}

.discount-col {
  color: #10b981;
  font-weight: 600;
}

.loading-mini, .no-data-mini {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 1rem 0;
}
</style>