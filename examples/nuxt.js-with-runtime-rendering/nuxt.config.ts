export default defineNuxtConfig({
    app: {
        head: {
            script: [
                { innerHTML: 'document.documentElement.style.display = "none"' }
            ]
        }
    }
})