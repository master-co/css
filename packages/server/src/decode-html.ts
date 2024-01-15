/*
 * The framework will encode attribute values ​​when rendering HTML to prevent XSS,
 * so we must decode it for correct CSS selectors.
 * https://github.com/facebook/react/issues/27836
 */
export default function decodeHTML(html: string) {
    return html.replace(/&(amp|apos|#39|#x27|quot|lt|gt);/g, (match, entity) => {
        switch (entity) {
            case 'amp':
                return '&'
            case 'apos':
            case '#39':
            case '#x27':
                return '\''
            case 'quot':
                return '"'
            case 'lt':
                return '<'
            case 'gt':
                return '>'
            default:
                return match // 如果不是已知的實體，保留原樣
        }
    })
}