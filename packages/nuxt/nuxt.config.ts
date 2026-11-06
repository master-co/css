// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  telemetry: false,
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils/module'
  ]
})