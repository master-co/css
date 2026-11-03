function escapeString(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = function getCodeTokenRegex(char, bypassSpan = false) {
    const escapedChar = escapeString(char);
    return new RegExp(bypassSpan 
        ? `(\\B|[^${escapedChar}])${escapedChar}${escapedChar}(.*?)${escapedChar}${escapedChar}(?!${escapedChar})`
        : `(\\B|[^${escapedChar}])${escapedChar}(?:<span.*?>)?${escapedChar}((.*?)(<\/?span.*?>)(.*?))(?:<span class="token Mspace">${escapedChar}<\/span>|${escapedChar})(?:<span class="token Mspace">${escapedChar}<\/span>|${escapedChar}(?!${escapedChar}))`
        , 'g');
}
