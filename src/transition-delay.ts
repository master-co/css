import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDelayStyle extends Style {
    static override prefixes =  /^~delay:/;
    static override property = TRANSITION + DASH + DELAY;
    static override unit = 'ms';
}