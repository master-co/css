export default defineNuxtConfig({
  css: ['~/app.css'],
  modules: [
    // '../src/module',
    ['../src/module', {
      mode: 'prerender'
    }],
  ],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-16'
})
