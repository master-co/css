const getCodeTokenRegex = require('./getCodeTokenRegex')

module.exports = function clearCodeTokens(code) {
    return code
        .replace(getCodeTokenRegex('*', true), '$1$2')
        .replace(getCodeTokenRegex('-', true), '$1$2')
        .replace(getCodeTokenRegex('_', true), '$1$2')
        .replace(getCodeTokenRegex('+', true), '$1$2')
        .replace(getCodeTokenRegex('.', true), '$1$2')
        .replace(getCodeTokenRegex('~', true), '$1$2')
}