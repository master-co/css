import { dash, DELAY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDelay extends Style {
    static override matches = /^~delay:./;
    static override key = dash(TRANSITION, DELAY);
    static override unit = 'ms';
}