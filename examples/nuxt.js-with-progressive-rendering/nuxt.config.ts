export default defineNuxtConfig({
    modules: ['@master/css.nuxt'],
    vite: {
        define: {
            __NUXT_ASYNC_CONTEXT__: false
        }
    }
})
