import { MasterCSSRule } from '../rule';
import { BOX, BREAK, dash, DECORATION } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BoxDecorationBreak'
    static override matches = /^box:(slice|clone)(?!\|)/;
    static override propName = dash(BOX, DECORATION, BREAK);
    override get(declaration): { [key: string]: any } {
        return {
            'box-decoration-break': declaration,
            '-webkit-box-decoration-break': declaration
        }
    };
}