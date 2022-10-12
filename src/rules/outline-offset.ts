import { dash, OFFSET, OUTLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'OutlineOffset'
    static override propName = dash(OUTLINE, OFFSET);
}