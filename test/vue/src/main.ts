import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
import { createPinia } from 'pinia';
import '@arco-design/web-vue/dist/arco.css';
import '@/styles/global.css';
import App from './App.vue';
import { router } from './router';
import { setupMockServer } from './services/mock/mockServer';

// 无真实后端，链路走内存假后端。
setupMockServer();

createApp(App).use(createPinia()).use(router).use(ArcoVue).mount('#app');
