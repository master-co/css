import { dash, LIST, STYLE, TYPE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ListStyleType extends MasterCSSRule {
    static override matches = /^list-style:(disc|decimal)(?!\|)/;
    static override propName = dash(LIST, STYLE, TYPE);
}