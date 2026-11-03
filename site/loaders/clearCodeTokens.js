const clearCodeTokens = require('../utils/clearCodeTokens');

module.exports = function (source, map) {
    this.cacheable();
    this.callback(
        null,
        clearCodeTokens(source),
        map);
}