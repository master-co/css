// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            script: [
                { innerHTML: 'document.documentElement.style.display = "none"' }
            ]
        }
    }
})