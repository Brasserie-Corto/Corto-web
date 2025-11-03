<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const message = ref('');

const handleSubmit = () => {
  if (!name.value || !email.value || !message.value) {
    alert('Please fill out all fields.');
    return;
  }

  const subject = `Message from ${name.value}`;
  const body = `${message.value}\n\nFrom: ${name.value}\nEmail: ${email.value}`;
  const mailtoLink = `mailto:thomassilvestre31@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  alert('Your email client is opening to send the message. Please complete sending it from there.');
};
</script>

<template>
  <div class="contact-page">
    <div class="card">
      <h1>Contact Us</h1>
      <p>Have a question or some feedback? Drop us a line! We'd love to hear from you.</p>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Your Name</label>
          <input type="text" id="name" v-model="name" required />
        </div>
        <div class="form-group">
          <label for="email">Your Email</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="message">Your Message</label>
          <textarea id="message" rows="6" v-model="message" required></textarea>
        </div>
        <button type="submit">Send Message</button>
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