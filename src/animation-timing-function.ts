import { ANIMATION, dash, TIMING_FUNCTION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationTimingFunction extends Style {
    static override matches = /^\@easing:./;
    static override key = dash(ANIMATION, TIMING_FUNCTION);
}