import { dash, LIST, POSITION, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ListStylePosition extends MasterCSSRule {
    static override matches = /^list-style:(inside|outside)(?!\|)/;
    static override propName = dash(LIST, STYLE, POSITION);
}