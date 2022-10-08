import { dash, DECORATION, TEXT, THICKNESS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextDecorationThickness extends MasterCSSRule {
    static override matches = /^text-decoration:(from-font(?!\|)|([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$)/;
    static override propName = dash(TEXT, DECORATION, THICKNESS);
    static override unit = 'em';
}