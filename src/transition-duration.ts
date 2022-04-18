import { DASH, DURATION, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDuration extends Style {
    static override matches =  /^~duration:./;
    static override key = TRANSITION + DASH + DURATION;
    static override unit = 'ms';
}