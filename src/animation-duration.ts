import { ANIMATION, DASH, DURATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDurationStyle extends Style {
    static override prefixes = /^\*duration:/;
    static override key = ANIMATION + DASH + DURATION;
    static override unit = 'ms';
}