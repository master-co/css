import { dash, DURATION, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransitionDuration extends MasterCSSRule {
    static override matches = /^~duration:./;
    static override propName = dash(TRANSITION, DURATION);
    static override unit = 'ms';
}