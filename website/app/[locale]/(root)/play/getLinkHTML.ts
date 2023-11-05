export function getLinkHTML({ text, src, rel, href, as, blocking }: any) {
    if (text) { return '' }
    return [
        '<link',
        as && `as="${as}"`,
        rel && `rel="${rel}"`,
        (href || src) && `href="${href || src}"`,
        '>'
    ].join(' ')
}