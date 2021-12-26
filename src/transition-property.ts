import { DASH, PROPERTY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionPropertyStyle extends Style {
    static override matches =  /^~property:/;
    static override key = TRANSITION + DASH + PROPERTY;
}