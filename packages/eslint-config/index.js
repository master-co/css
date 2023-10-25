module.exports = {
    plugins: ['@master/css'],
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
}
