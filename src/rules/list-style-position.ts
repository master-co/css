import { dash, LIST, POSITION, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ListStylePosition'
    static override matches = /^list-style:(inside|outside)(?!\|)/;
    static override propName = dash(LIST, STYLE, POSITION);
}