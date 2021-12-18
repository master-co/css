import { DASH, DURATION, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDurationStyle extends Style {
    static override prefixes =  /^~duration:/;
    static override key = TRANSITION + DASH + DURATION;
    static override unit = 'ms';
}