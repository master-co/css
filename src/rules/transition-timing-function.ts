import { dash, TIMING_FUNCTION, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransitionTimingFunction extends MasterCSSRule {
    static override matches = /^~easing:./;
    static override propName = dash(TRANSITION, TIMING_FUNCTION);
}