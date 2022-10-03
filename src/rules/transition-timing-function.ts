import { dash, TIMING_FUNCTION, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TransitionTimingFunction extends MasterCSSRule {
    static override matches = /^~easing:./;
    static override key = dash(TRANSITION, TIMING_FUNCTION);
}