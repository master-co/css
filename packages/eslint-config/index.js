module.exports = {
    plugins: ['@master/css'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        '@master/css/class-order': 'warn',
        '@master/css/class-validation': ['error', {
            disallowTraditionalClass: true
        }]
    },
    settings: {
        '@master/css': {
            callees: ['classnames', 'clsx', 'ctl', 'cva', 'cv', 'classVariant', 'styled'],
            ignoredKeys: ['compoundVariants', 'defaultVariants'],
            classMatching: '^class(Name)?$',
            config: 'master.css.*',
            tags: []
        }
    }
}
