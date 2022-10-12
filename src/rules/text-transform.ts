import { dash, TEXT, TRANSFORM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextTransform'
    static override matches = /^t(ext)?:(uppercase|lowercase|capitalize)(?!\|)/;
    static override propName = dash(TEXT, TRANSFORM);
}