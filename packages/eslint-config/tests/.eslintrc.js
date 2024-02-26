module.exports = {
    extends: '@master/css',
    overrides: [
        {
            'files': [
                '*.html'
            ],
            'parser': '@angular-eslint/template-parser'
        }
    ]
}