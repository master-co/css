import { MasterCSSRule } from '../rule';
import { BOX, BREAK, dash, DECORATION } from '../constants/css-property-keyword';

export class BoxDecorationBreak extends MasterCSSRule {
    static override matches = /^box:(slice|clone)(?!\|)/;
    static override key = dash(BOX, DECORATION, BREAK);
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            'box-decoration-break': propertyInfo,
            '-webkit-box-decoration-break': propertyInfo
        }
    };
}