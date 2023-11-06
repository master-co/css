const config = {
    rules: {
        '@master/css/class-order': 'warn',
        '@master/css/class-validation': 'error',
        '@master/css/class-collision': 'warn'
    },
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    }
} as const

export default config