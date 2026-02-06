import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/',
    name: 'Shop',
    component: () => import('@/views/ShopView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/AboutView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/live',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/ContactView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/CartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/order/:orderId',
    name: 'OrderConfirmation',
    component: () => import('@/views/OrderConfirmationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/AdminOrdersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let authInitialized = false;

/**
 * Navigation guard to protect routes and redirect unauthorized users
 */
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Initialize auth only once on first navigation
  if (!authInitialized) {
    authInitialized = true;
    await authStore.initializeAuth();
  }

  // If route requires admin access
  if (to.meta.requiresAdmin) {
    if (authStore.user?.role !== 'admin') {
      next('/');
      return;
    }
  }

  // If route requires authentication
  if (to.meta.requiresAuth) {
    // Not logged in: redirect to auth
    if (!authStore.isLoggedIn) {
      next('/auth');
      return;
    }

    // Logged in but not activated by admin: redirect to auth with message
    if (!authStore.isActive) {
      next('/auth');
      return;
    }
  }

  // Already authenticated and trying to access /auth: redirect to home
  if (to.path === '/auth' && authStore.isLoggedIn && authStore.isActive) {
    next('/');
    return;
  }

  next();
});

export default router;