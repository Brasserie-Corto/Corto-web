<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoginView = ref(true);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Form fields
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const toggleView = () => {
  isLoginView.value = !isLoginView.value;
  // Clear fields and errors when toggling
  name.value = '';
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  error.value = null;
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields.';
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  try {
    await authStore.login(email.value, password.value);
    router.push('/'); // Redirect to shop on successful login
  } catch (err) {
    error.value = 'Login failed. Please check your credentials.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const handleSignup = async () => {
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    await authStore.signup(name.value, email.value, password.value);
    router.push('/'); // Redirect to shop on successful signup
  } catch (err) {
    error.value = 'Signup failed. Please try again.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="card auth-card">
      <!-- Login Form -->
      <div v-if="isLoginView">
        <h1>Login</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" v-model="email" required />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" v-model="password" required />
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
        <p class="toggle-text">
          Don't have an account? 
          <a href="#" @click.prevent="toggleView">Sign Up</a>
        </p>
      </div>

      <!-- Signup Form -->
      <div v-else>
        <h1>Sign Up</h1>
        <form @submit.prevent="handleSignup">
          <div class="form-group">
            <label for="signup-name">Name</label>
            <input type="text" id="signup-name" v-model="name" required />
          </div>
          <div class="form-group">
            <label for="signup-email">Email</label>
            <input type="email" id="signup-email" v-model="email" required />
          </div>
          <div class="form-group">
            <label for="signup-password">Password</label>
            <input type="password" id="signup-password" v-model="password" required />
          </div>
          <div class="form-group">
            <label for="signup-confirm-password">Confirm Password</label>
            <input type="password" id="signup-confirm-password" v-model="confirmPassword" required />
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <p class="toggle-text">
          Already have an account? 
          <a href="#" @click.prevent="toggleView">Login</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 450px;
  margin: 0 auto;
}

.auth-card {
  padding: 2.5rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
}

button {
  width: 100%;
}

.toggle-text {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--text-color);
}
</style>