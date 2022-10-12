import { dash, LIST, STYLE, TYPE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ListStyleType'
    static override matches = /^list-style:(disc|decimal)(?!\|)/;
    static override propName = dash(LIST, STYLE, TYPE);
}