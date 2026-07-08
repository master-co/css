export default defineNuxtConfig({
  css: ['~/app.css'],
  modules: [
    ['../../../src/module', {
      mode: 'runtime'
    }]
  ],
})
