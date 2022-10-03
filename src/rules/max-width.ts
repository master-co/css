import { MAX_WIDTH, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MaxWidth extends MasterCSSRule {
    static override matches = /^max-w:./;
    static override key = MAX_WIDTH;
    static override values = SIZING_VALUES;
}