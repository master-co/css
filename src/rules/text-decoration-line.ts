import { dash, DECORATION, LINE, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextDecorationLine extends MasterCSSRule {
    static override matches = /^t(ext)?:(none|underline|overline|line-through)(?!\|)/;
    static override propName = dash(TEXT, DECORATION, LINE);
}