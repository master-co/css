module.exports = {
    extends: [
        '@master/css'
    ],
    rules: {
        '@master/css/class-validation': ['error', {
            disallowUnknownClass: true
        }],
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
        }
    ]
}