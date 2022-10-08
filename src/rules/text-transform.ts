import { dash, TEXT, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextTransform extends MasterCSSRule {
    static override matches = /^t(ext)?:(uppercase|lowercase|capitalize)(?!\|)/;
    static override propName = dash(TEXT, TRANSFORM);
}