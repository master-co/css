import { dash, DELAY, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransitionDelay extends MasterCSSRule {
    static override matches = /^~delay:./;
    static override propName = dash(TRANSITION, DELAY);
    static override unit = 'ms';
}