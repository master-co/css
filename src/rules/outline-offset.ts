import { dash, OFFSET, OUTLINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class OutlineOffset extends MasterCSSRule {
    static override key = dash(OUTLINE, OFFSET);
}