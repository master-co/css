import { ANIMATION, DASH, TIMING_FUNCTION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationTimingFunctionStyle extends MasterStyle {
    static override prefixes = /^\*easing:/;
    static override properties = [ANIMATION + DASH + TIMING_FUNCTION];
}