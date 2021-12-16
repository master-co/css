import { DASH, PROPERTY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionPropertyStyle extends Style {
    static override prefixes =  /^~property:/;
    static override properties = [TRANSITION + DASH + PROPERTY];
}