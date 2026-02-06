import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/',
    name: 'Shop',
    component: () => import('@/views/global/ShopView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/global/AboutView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/live',
    name: 'Dashboard',
    component: () => import('@/views/global/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/global/ContactView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/order/CartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/order/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/order/:orderId',
    name: 'OrderConfirmation',
    component: () => import('@/views/order/OrderConfirmationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/auth/AuthView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'Admin',
    component: () => import('@/views/admin/AdminUserView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/admin/AdminOrdersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
    {
        path: '/admin/calendar',
        name: 'AdminCalendar',
        component: () => import('@/views/admin/AdminCalendarView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
        path: '/admin/promotions',
        name: 'AdminPromotions',
        component: () => import('@/views/admin/AdminPromosView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
    },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/global/NotFoundView.vue'),
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