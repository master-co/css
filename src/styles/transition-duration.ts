import { dash, DURATION, TRANSITION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TransitionDuration extends Style {
    static override matches = /^~duration:./;
    static override key = dash(TRANSITION, DURATION);
    static override unit = 'ms';
}