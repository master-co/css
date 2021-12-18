import { ANIMATION, DASH, TIMING_FUNCTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationTimingFunctionStyle extends Style {
    static override prefixes = /^\*easing:/;
    static override key = ANIMATION + DASH + TIMING_FUNCTION;
}