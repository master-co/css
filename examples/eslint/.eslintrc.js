module.exports = {
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: [
        'plugin:mdx/recommended',
        '@master/css',
    ],
    rules: {
        '@master/css/class-validation': ['error', {
            disallowUnknownClass: true
        }],
    },
    settings: {
        'mdx/code-blocks': true,
        '@master/css': {
            config: 'examples/eslint/master.css.*'
        }
    },
    overrides: [
        {
            'files': [
                '*.html'
            ],
            'parser': '@angular-eslint/template-parser'
        },
        {
            'files': [
                '*.ts',
                '*.tsx',
                '*.js'
            ],
            'parser': '@typescript-eslint/parser'
        },
        {
            'files': [
                '*.mdx',
                '*.md'
            ],
            'parser': 'eslint-mdx'
        }
    ]
}