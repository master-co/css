import { ANIMATION, DASH, TIMING_FUNCTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationTimingFunctionStyle extends Style {
    static override prefixes = /^\*easing:/;
    static override property = ANIMATION + DASH + TIMING_FUNCTION;
}