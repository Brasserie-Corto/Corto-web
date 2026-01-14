<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/config/api';

const authStore = useAuthStore();
const subject = ref('');
const message = ref('');
const isSubmitting = ref(false);
const submitMessage = ref('');
const submitError = ref('');

const handleSubmit = async () => {
  if (!subject.value || !message.value) {
    submitError.value = 'Veuillez remplir tous les champs.';
    return;
  }

  if (!authStore.user?.email) {
    submitError.value = 'Vous devez être connecté pour envoyer un message.';
    return;
  }

  isSubmitting.value = true;
  submitError.value = '';
  submitMessage.value = '';

  try {
    const response = await fetch(`${API_URL}/send-contact-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: authStore.user.email,
        subject: subject.value,
        message: message.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    submitMessage.value = 'Votre message a été envoyé avec succès !';
    subject.value = '';
    message.value = '';
  } catch (error) {
    console.error('Error sending email:', error);
    submitError.value = 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="contact-page">
    <div class="card">
      <h1>Contactez-nous</h1>
      <p>Une question ou un retour ? Écrivez-nous, on sera ravis de vous lire !</p>
      <div v-if="!authStore.isLoggedIn" class="warning">
        Vous devez être connecté pour envoyer un message.
      </div>
      <form v-else @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="subject">Objet</label>
          <input type="text" id="subject" v-model="subject" required />
        </div>
        <div class="form-group">
          <label for="message">Votre message</label>
          <textarea id="message" rows="6" v-model="message" required></textarea>
        </div>
        <div v-if="submitError" class="error-message">{{ submitError }}</div>
        <div v-if="submitMessage" class="success-message">{{ submitMessage }}</div>
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Envoi...' : 'Envoyer' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  max-width: 700px;
  margin: 0 auto;
}

textarea {
  resize: vertical;
}

.warning {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>