/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        canvas: '#f5f6f7',
      },
    },
  },
  // Arco 自带重置样式，重复 preflight 会覆盖 Arco 组件的基础样式
  corePlugins: {
    preflight: false,
  },
};
