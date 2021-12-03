import { DASH, TIMING_FUNCTION, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterTransitionTimingFunctionStyle extends MasterStyle {
    static override prefixes =  /^(transition-timing-function|~easing):/;
    static override properties = [TRANSITION + DASH + TIMING_FUNCTION];
}