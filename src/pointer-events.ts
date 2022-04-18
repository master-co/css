import { Style } from '@master/style';
import { DASH, EVENTS, POINTER } from './constants/css-property-keyword';

export class PointerEvents extends Style {
    static override key = POINTER + DASH + EVENTS;
}