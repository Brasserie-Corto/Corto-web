<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoginView = ref(true);
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Login form fields
const loginEmail = ref('');
const loginPassword = ref('');

// Signup form fields
const signupName = ref('');
const signupLastname = ref('');
const signupEmail = ref('');
const signupPassword = ref('');
const signupConfirmPassword = ref('');
const signupPhone = ref('');
const signupAddress = ref('');

// Computed: Show pending activation message if user logged in but not active
const isPendingActivation = computed(() => authStore.isLoggedIn && !authStore.isActive);

const toggleView = () => {
  isLoginView.value = !isLoginView.value;
  clearForm();
};

const clearForm = () => {
  loginEmail.value = '';
  loginPassword.value = '';
  signupName.value = '';
  signupLastname.value = '';
  signupEmail.value = '';
  signupPassword.value = '';
  signupConfirmPassword.value = '';
  signupPhone.value = '';
  signupAddress.value = '';
  error.value = null;
  successMessage.value = null;
};

const handleLogin = async () => {
  if (!loginEmail.value || !loginPassword.value) {
    error.value = 'Please fill in all fields.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    await authStore.login(loginEmail.value, loginPassword.value);
    
    if (authStore.isActive) {
      successMessage.value = 'Login successful! Redirecting...';
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      error.value = 'Your account is pending admin approval. You will be notified when activated.';
    }
  } catch (err: any) {
    error.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    isLoading.value = false;
  }
};

const handleSignup = async () => {
  // Validation
  if (
    !signupName.value ||
    !signupLastname.value ||
    !signupEmail.value ||
    !signupPassword.value ||
    !signupConfirmPassword.value ||
    !signupPhone.value
  ) {
    error.value = 'Please fill in all required fields.';
    return;
  }

  if (signupPassword.value !== signupConfirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  if (signupPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    await authStore.signup(
      signupName.value,
      signupLastname.value,
      signupEmail.value,
      signupPassword.value,
      signupPhone.value,
      signupAddress.value
    );

    successMessage.value =
      'Account created successfully! Please wait for admin approval before accessing the site.';
    clearForm();
    isLoginView.value = true; // Switch back to login view

    setTimeout(() => {
      successMessage.value = null;
    }, 5000);
  } catch (err: any) {
    error.value = err.message || 'Signup failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  error.value = null;
  successMessage.value = null;
};
</script>

<template>
  <div class="auth-page">
    <!-- Pending Activation Message -->
    <div v-if="isPendingActivation" class="pending-activation-card">
      <div class="pending-badge">⏳ Pending Activation</div>
      <h2>Your account is pending admin approval</h2>
      <p>
        Thank you for signing up! An administrator will review your account shortly.
        You will receive a notification once your account is activated.
      </p>
      <button @click="handleLogout" class="btn-logout">Logout</button>
    </div>

    <!-- Login/Signup Forms -->
    <div v-else class="card auth-card">
      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- Login Form -->
      <div v-if="isLoginView">
        <h1>Login</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              type="email"
              id="login-email"
              v-model="loginEmail"
              placeholder="your@email.com"
              required
            />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              v-model="loginPassword"
              placeholder="••••••••"
              required
            />
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <button type="submit" :disabled="isLoading" class="btn-primary">
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
        <h1>Create Account</h1>
        <p class="form-note">* Required fields</p>
        <form @submit.prevent="handleSignup">
          <div class="form-row">
            <div class="form-group">
              <label for="signup-name">First Name *</label>
              <input
                type="text"
                id="signup-name"
                v-model="signupName"
                placeholder="John"
                required
              />
            </div>
            <div class="form-group">
              <label for="signup-lastname">Last Name *</label>
              <input
                type="text"
                id="signup-lastname"
                v-model="signupLastname"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="signup-email">Email *</label>
            <input
              type="email"
              id="signup-email"
              v-model="signupEmail"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="signup-phone">Phone *</label>
            <input
              type="tel"
              id="signup-phone"
              v-model="signupPhone"
              placeholder="+33 6 12 34 56 78"
              required
            />
          </div>

          <div class="form-group">
            <label for="signup-address">Address (Optional)</label>
            <input
              type="text"
              id="signup-address"
              v-model="signupAddress"
              placeholder="123 Rue de la Bière"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="signup-password">Password *</label>
              <input
                type="password"
                id="signup-password"
                v-model="signupPassword"
                placeholder="••••••••"
                required
              />
            </div>
            <div class="form-group">
              <label for="signup-confirm-password">Confirm Password *</label>
              <input
                type="password"
                id="signup-confirm-password"
                v-model="signupConfirmPassword"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>
          <button type="submit" :disabled="isLoading" class="btn-primary">
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
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-card {
  padding: 2.5rem;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

h2 {
  color: #333;
  margin-bottom: 1rem;
}

.form-note {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.toggle-text {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
}

.toggle-text a {
  color: #8b5a00;
  text-decoration: none;
  font-weight: 600;
}

.toggle-text a:hover {
  text-decoration: underline;
}

/* Pending Activation Styles */
.pending-activation-card {
  background: white;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pending-badge {
  display: inline-block;
  background-color: #fff3cd;
  color: #856404;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.pending-activation-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.btn-logout {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: #5a6268;
}

@media (max-width: 600px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>