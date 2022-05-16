import { Style } from '../style';
import { dash, EVENTS, POINTER } from '../constants/css-property-keyword';

export class PointerEvents extends Style {
    static override key = dash(POINTER, EVENTS);
}