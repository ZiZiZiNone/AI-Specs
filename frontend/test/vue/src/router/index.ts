import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tickets' },
  {
    path: '/tickets',
    name: 'ticket-list',
    component: () => import('@/pages/TicketListPage.vue'),
  },
  {
    path: '/tickets/:id',
    name: 'ticket-detail',
    component: () => import('@/pages/TicketDetailPage.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
