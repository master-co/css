import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDelayStyle extends Style {
    static override matches =  /^~delay:/;
    static override key = TRANSITION + DASH + DELAY;
    static override unit = 'ms';
}