<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const message = ref('');

const handleSubmit = () => {
  if (!name.value || !email.value || !message.value) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  const subject = `Message de ${name.value}`;
  const body = `${message.value}\n\nDe : ${name.value}\nEmail : ${email.value}`;
  const mailtoLink = `mailto:thomassilvestre31@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  alert('Votre client mail va s\'ouvrir pour envoyer le message.');
};
</script>

<template>
  <div class="contact-page">
    <div class="card">
      <h1>Contactez-nous</h1>
      <p>Une question ou un retour ? Écrivez-nous, on sera ravis de vous lire !</p>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Votre nom</label>
          <input type="text" id="name" v-model="name" required />
        </div>
        <div class="form-group">
          <label for="email">Votre email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="message">Votre message</label>
          <textarea id="message" rows="6" v-model="message" required></textarea>
        </div>
        <button type="submit">Envoyer</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  max-width: 700px;
  margin: 0 auto;
}
</style>