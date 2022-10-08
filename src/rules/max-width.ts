import { MAX_WIDTH } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MaxWidth extends MasterCSSRule {
    static override matches = /^max-w:./;
    static override propName = MAX_WIDTH;
}