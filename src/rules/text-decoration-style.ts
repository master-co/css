import { dash, DECORATION, STYLE, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextDecorationStyle extends MasterCSSRule {
    static override matches = /^t(ext)?:(solid|double|dotted|dashed|wavy)(?!\|)/;
    static override propName = dash(TEXT, DECORATION, STYLE);
}