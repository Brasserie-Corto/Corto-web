import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/config/supabase';
import type { User } from '@/types';

export interface AuthUser extends User {
  is_active: boolean;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => !!user.value);
  const isActive = computed(() => user.value?.is_active ?? false);

  /**
   * Initialize auth state from Supabase session
   */
  async function initializeAuth() {
    try {
      loading.value = true;
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (data?.session?.user) {
        await fetchUserProfile(data.session.user.id);
      } else {
        user.value = null;
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch user profile from `client` table
   */
  async function fetchUserProfile(userId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('client')
        .select('id, name, mail, is_active, role, user_id')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      user.value = {
        id: data.user_id,
        name: data.name,
        email: data.mail,
        is_active: data.is_active,
        role: data.role,
      };
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      user.value = null;
    }
  }

  /**
   * Login with email and password
   */
  async function login(email: string, password: string): Promise<void> {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data?.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      console.error('Login error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Sign up with email, password, name, and lastname
   * Creates a new auth user and a client record with is_active=false
   */
  async function signup(
    name: string,
    lastname: string,
    email: string,
    password: string,
    phone: string = '',
    address: string = ''
  ): Promise<void> {
    try {
      loading.value = true;
      error.value = null;

      // Create Supabase auth user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;

      if (!authData?.user?.id) {
        throw new Error('Failed to create user');
      }

      const userId = authData.user.id;

      // Create client record with is_active=false (waiting for admin approval)
      const { error: clientError } = await supabase
        .from('client')
        .insert({
          user_id: userId,
          name,
          lastname,
          mail: email,
          phone,
          address,
          is_active: false, // Waiting for admin approval
          role: 'user',
        });

      if (clientError) {
        // Clean up: delete the auth user if client creation fails
        await supabase.auth.admin.deleteUser(userId);
        throw clientError;
      }

      // Fetch the newly created profile
      await fetchUserProfile(userId);
    } catch (err: any) {
      error.value = err.message || 'Signup failed';
      console.error('Signup error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout
   */
  async function logout(): Promise<void> {
    try {
      loading.value = true;
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      user.value = null;
    } catch (err: any) {
      error.value = err.message || 'Logout failed';
      console.error('Logout error:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Listen to auth state changes
   */
  function setupAuthListener() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          user.value = null;
        }
      }
    );

    return subscription;
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    isActive,
    initializeAuth,
    fetchUserProfile,
    login,
    signup,
    logout,
    setupAuthListener,
  };
});