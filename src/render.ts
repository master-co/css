import { StyleSheet } from './';
import './polyfills/css-escape';

export function render(html: string, options: { StyleSheet: typeof StyleSheet }): {
    stylesCss: string,
    html: string
} {
    if (!html) {
        return {
            stylesCss: '',
            html
        };
    }
    const _StyleSheet = options.StyleSheet;
    const styleSheet = new _StyleSheet();
    const regexp = /\sclass="([^"]*)"/gm;
    let results: string[];
    while (results = regexp.exec(html)) {
        const classNames = results[1].replace(/\n/g, '').split(' ').filter(css => css);
        for (const eachClassName of classNames) {
            if (!(eachClassName in styleSheet.countOfName)) {
                styleSheet.findAndInsert(eachClassName);
                styleSheet.countOfName[eachClassName] = 1;
            }
        }
    }
    const stylesCss = styleSheet.styles.map(eachStyle => eachStyle.text).join('');
    return {
        stylesCss,
        html: html.includes('<head>')
            ? html.replace(/(<head>)/,
                `$1
                <style id="master-styles">${stylesCss}</style>`
            )
            : html
    };
}