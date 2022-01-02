import { Style } from '@master/style';
import { DASH, EVENTS, POINTER } from './constants/css-property-keyword';

export class PointerEventsStyle extends Style {
    static override key = POINTER + DASH + EVENTS;
}