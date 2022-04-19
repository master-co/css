import { ANIMATION, DASH, DURATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationDuration extends Style {
    static override matches = /^\@duration:./;
    static override key = ANIMATION + DASH + DURATION;
    static override unit = 'ms';
}