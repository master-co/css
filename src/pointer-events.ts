import { Style } from '@master/style';
import { DASH, EVENTS, POINTERS } from './constants/css-property-keyword';

export class PointerEventsStyle extends Style {
    static override property = POINTERS + DASH + EVENTS;
}