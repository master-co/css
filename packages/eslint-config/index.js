module.exports = {
    plugins: ['@master/css'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        '@master/css/classnames-order': 'warn'
    }
}