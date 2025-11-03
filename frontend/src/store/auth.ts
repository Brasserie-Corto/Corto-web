import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { User } from '@/types';

const STORAGE_KEY = 'corto-auth-user';

export const useAuthStore = defineStore('auth', () => {
  // Load initial state from localStorage
  const getInitialUser = (): User | null => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  };

  const user = ref<User | null>(getInitialUser());

  // Watch for changes and save to localStorage
  watch(
    user,
    (newUser) => {
      if (newUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    { deep: true }
  );
  
  const isLoggedIn = computed(() => !!user.value);

  // --- API Pluggable Actions ---
  // Replace these with your actual API calls

  async function login(email: string, password: string):Promise<void> {
    console.log('Attempting to log in with:', { email, password });
    // ** API CALL HERE: await api.auth.login({ email, password }) **
    // On success, the API should return user data.
    
    // Mocking a successful API response:
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const mockUserData: User = {
      id: '123',
      name: 'Jonny', // We'll extract a name from the email for the mock
      email: email,
    };
    user.value = mockUserData;
    console.log('Login successful');
  }

  async function signup(name: string, email: string, password: string): Promise<void> {
    console.log('Attempting to sign up with:', { name, email, password });
    // ** API CALL HERE: await api.auth.signup({ name, email, password }) **
    // On success, you might automatically log the user in or ask them to verify email.
    
    // Mocking a successful sign-up and login:
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const mockUserData: User = {
      id: '456',
      name: name,
      email: email,
    };
    user.value = mockUserData;
    console.log('Signup successful');
  }

  function logout() {
    user.value = null;
    console.log('User logged out');
  }

  return { user, isLoggedIn, login, signup, logout };
});