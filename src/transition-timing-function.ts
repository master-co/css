import { DASH, TIMING_FUNCTION, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionTimingFunction extends Style {
    static override matches =  /^~easing:./;
    static override key = TRANSITION + DASH + TIMING_FUNCTION;
}