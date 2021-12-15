import { MasterStyle } from '@master/style';
import { DASH, EVENTS, POINTERS } from './constants/css-property-keyword';

export class PointerEventsStyle extends MasterStyle {
    static override properties = [POINTERS + DASH + EVENTS];
}