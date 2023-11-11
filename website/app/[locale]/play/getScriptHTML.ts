export function getScriptHTML(script: any) {
    const { type = 'text/javascript', src, text } = script
    return [
        '<script',
        type && `type="${type}"`,
        src && `src="${src}"`,
        '>',
        text,
        '</script>'
    ].join(' ')
}