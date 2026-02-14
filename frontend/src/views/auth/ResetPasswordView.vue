<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth.ts';

const router = useRouter();
const authStore = useAuthStore();

const newPassword = ref('');
const confirmNewPassword = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isValidRecoveryToken = ref(false);

// Check if user has valid recovery token
onMounted(async () => {
  const hash = window.location.hash;
  console.log('ResetPassword page - hash:', hash);
  
  // Check if there's an access_token in the fragment (recovery flow)
  if (hash.includes('access_token=')) {
    isValidRecoveryToken.value = true;
    console.log('Valid recovery token detected');
  } else {
    // No recovery token, redirect to auth
    error.value = 'Lien de réinitialisation invalide ou expiré.';
    setTimeout(() => {
      router.push('/auth');
    }, 2000);
  }
});

const handleResetPassword = async () => {
  if (!newPassword.value || !confirmNewPassword.value) {
    error.value = 'Veuillez remplir tous les champs.';
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (newPassword.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    await authStore.updatePassword(newPassword.value);
    successMessage.value = 'Votre mot de passe a été réinitialisé avec succès !';
    
    // Clear the URL hash to prevent confusion
    window.history.replaceState({}, document.title, window.location.pathname);
    
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } catch (err: any) {
    error.value =
      err.message || 'Échec de la réinitialisation du mot de passe. Veuillez réessayer.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="reset-password-page">
    <div class="card reset-password-card">
      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="error && !isValidRecoveryToken" class="error-message">
        {{ error }}
      </div>

      <!-- Reset Password Form -->
      <div v-if="isValidRecoveryToken">
        <h1>Créer un nouveau mot de passe</h1>
        <p class="form-note">Entrez votre nouveau mot de passe pour réinitialiser votre compte.</p>
        
        <form @submit.prevent="handleResetPassword">
          <div class="form-group">
            <label for="new-password">Nouveau mot de passe</label>
            <input
              type="password"
              id="new-password"
              v-model="newPassword"
              placeholder="••••••••"
              required
            />
          </div>
          <div class="form-group">
            <label for="confirm-new-password">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirm-new-password"
              v-model="confirmNewPassword"
              placeholder="••••••••"
              required
            />
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <button type="submit" :disabled="isLoading" class="btn-primary">
            {{ isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reset-password-card {
  padding: 2.5rem;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-note {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #8b5a00;
  box-shadow: 0 0 0 3px rgba(139, 90, 0, 0.1);
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #8b5a00;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6b4600;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .reset-password-page {
    padding: 1rem;
  }

  .reset-password-card {
    padding: 1.5rem;
  }
}
</style>
