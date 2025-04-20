export default defineNuxtConfig({
    modules: [
        // '../src/module',
        ['../src/module', {
            mode: 'pre-render'
        }],
    ],
    devtools: { enabled: true },
    compatibilityDate: '2025-04-16'
})