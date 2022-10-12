import { ANIMATION, dash, TIMING_FUNCTION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationTimingFunction'
    static override matches = /^\@easing:./;
    static override propName = dash(ANIMATION, TIMING_FUNCTION);
}