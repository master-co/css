import { dash, PROPERTY, TRANSITION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TransitionProperty extends Style {
    static override matches = /^~property:./;
    static override key = dash(TRANSITION, PROPERTY);
}