import { MIN_WIDTH, SIZING_VALUES } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class MinWidth extends MasterCSSRule {
    static override matches = /^min-w:./;
    static override key = MIN_WIDTH;
    static override values = SIZING_VALUES;
}