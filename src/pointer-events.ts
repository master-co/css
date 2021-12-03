import { MasterStyle } from '@master/style';
import { DASH, EVENTS, POINTERS } from './constants/css-property-keyword';

export class MasterPointerEventsStyle extends MasterStyle {
    static override prefixes = /^pointer-events:/;
    static override properties = [POINTERS + DASH + EVENTS];
}