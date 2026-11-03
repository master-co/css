
import { Range } from './masterCssinterface'

import { render } from '@master/css/render';
import { css_beautify } from 'js-beautify';
import { CloneStyleSheet } from '~/utils/clone-style-sheet';


export function doHover(instance: string, range: Range) {

    let renderText = render(`<p class="${instance}">`, { StyleSheet: CloneStyleSheet }).css;

    if (renderText == null || renderText == '' || renderText == ' ') {
        return null;
    }

    return {
        contents: {
            language: 'css',
            value: css_beautify(renderText, {
                newline_between_rules: true,
                end_with_newline: true
            })
        },
        range: range
    };
}