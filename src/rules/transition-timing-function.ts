import { dash, TIMING_FUNCTION, TRANSITION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TransitionTimingFunction'
    static override matches = /^~easing:./;
    static override propName = dash(TRANSITION, TIMING_FUNCTION);
}