module.exports = {
    plugins: ['@master/css'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        '@master/css/class-order': 'warn',
        '@master/css/class-validation': 'warn'
    }
}