import { Style } from './style';
import { StyleSheet } from './sheet';
import './polyfills/css-escape';
import { generateColorVariablesText } from './utils/generate-color-variables-text';

export function render(html: string, StyleSheetCls: typeof StyleSheet, StyleCls: typeof Style): { stylesCss: string, colorsCss: string, colorsMetaContent: string, html: string } {
    if (!html) {
        return {
            stylesCss: '',
            colorsCss: '',
            colorsMetaContent: '',
            html
        };
    }

    const styleSheet = new StyleSheetCls();
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
    const colorsCss = StyleCls.colorNames
        .map(colorName => generateColorVariablesText(colorName, StyleCls.rgbColors[colorName]))
        .join('');
    const colorsMetaContent = StyleCls.colorNames.join(',');
    return {
        stylesCss,
        colorsCss,
        colorsMetaContent,
        html: html.includes('<head>')
            ? html.replace(/(<head>)/,
                `$1
                <style id="master-colors">${colorsCss}</style>
                <meta name="master:colors" content="${colorsMetaContent}"></meta>
                <style id="master-styles">${stylesCss}</style>`
            )
            : html
    };
}