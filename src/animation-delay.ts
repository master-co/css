import { ANIMATION, DASH, DELAY } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDelayStyle extends Style {
    static override prefixes = /^\*delay:/;
    static override property = ANIMATION + DASH + DELAY;
    static override unit = 'ms';
}