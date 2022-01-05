import { ANIMATION, DASH, TIMING_FUNCTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationTimingFunctionStyle extends Style {
    static override matches = /^\@easing:./;
    static override key = ANIMATION + DASH + TIMING_FUNCTION;
}