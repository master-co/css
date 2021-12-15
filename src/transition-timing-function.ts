import { DASH, TIMING_FUNCTION, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransitionTimingFunctionStyle extends MasterStyle {
    static override prefixes =  /^~easing:/;
    static override properties = [TRANSITION + DASH + TIMING_FUNCTION];
}