import { dash, TIMING_FUNCTION, TRANSITION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TransitionTimingFunction extends Style {
    static override matches = /^~easing:./;
    static override key = dash(TRANSITION, TIMING_FUNCTION);
}