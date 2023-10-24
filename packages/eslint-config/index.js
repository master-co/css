module.exports = {
    plugins: ['@master/css'],
    rules: {
        '@master/css/class-order': 'warn',
        '@master/css/class-validation': 'error'
    },
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    }
}
