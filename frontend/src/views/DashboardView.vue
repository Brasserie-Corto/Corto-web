<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { API_URL } from '@/config/api';

// WebSocket URL (convert http to ws)
const WS_URL = API_URL.replace(/^http/, 'ws');

interface DashboardStats {
  recipes_count: number;
  liters_brewed: number;
  orders_count: number;
}

const stats = ref<DashboardStats>({
  recipes_count: 0,
  liters_brewed: 0,
  orders_count: 0,
});

const isConnected = ref(false);
let socket: WebSocket | null = null;

const fetchStats = async () => {
  try {
    const response = await fetch(`${API_URL}/dashboard-stats`);
    if (response.ok) {
      stats.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

const connectWebSocket = () => {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
    isConnected.value = true;
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'STATS_UPDATE') {
        stats.value = message.data;
      }
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    isConnected.value = false;
    // Try to reconnect after 5 seconds
    setTimeout(connectWebSocket, 5000);
  };
};

onMounted(() => {
  fetchStats();
  connectWebSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.close();
  }
});
</script>

<template>
  <div class="dashboard-page">
    <div class="header">
      <h1>Tableau de Bord Brasserie</h1>
      <div class="status-badge" :class="{ online: isConnected }">
        <span class="dot"></span>
        {{ isConnected ? 'En Direct' : 'Connexion...' }}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card brewed">
        <div class="icon">🍺</div>
        <div class="stat-value">{{ stats.liters_brewed }} L</div>
        <div class="stat-label">Litres Brassés</div>
      </div>
      
      <div class="stat-card recipes">
        <div class="icon">📜</div>
        <div class="stat-value">{{ stats.recipes_count }}</div>
        <div class="stat-label">Recettes Actives</div>
      </div>

      <div class="stat-card orders">
        <div class="icon">📦</div>
        <div class="stat-value">{{ stats.orders_count }}</div>
        <div class="stat-label">Commandes Terminées</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 2rem;
  color: #1a1a1a;
  font-weight: 700;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.2rem;
  background: #f3f4f6;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

.status-badge.online {
  background: #ecfdf5;
  color: #059669;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.1);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9ca3af;
  transition: all 0.3s ease;
}

.online .dot {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
}

.stat-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0,0,0,0.02);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
}

.stat-card.brewed::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
.stat-card.recipes::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.stat-card.orders::before { background: linear-gradient(90deg, #10b981, #059669); }

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.icon {
  font-size: 3.5rem;
  margin: 0 auto 1.5rem;
  width: 100px;
  height: 100px;
  line-height: 100px;
  border-radius: 50%;
  background: #f8fafc;
  transition: transform 0.3s ease;
}

.stat-card:hover .icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-value {
  font-size: 4rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
