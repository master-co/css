import { StyleSheet } from './';
import './polyfills/css-escape';

export function render(html: string, options: { StyleSheet: typeof StyleSheet }): {
    css: string,
    html: string
} {
    if (!html) {
        return {
            css: '',
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
    const css = styleSheet.styles.map(eachStyle => eachStyle.text).join('');
    return {
        css,
        html: html.includes('<head>')
            ? html.replace(/(<head>)/, `$1<style id="master-css">${css}</style>`)
            : html
    };
}