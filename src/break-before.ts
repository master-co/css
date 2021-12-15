import { MasterStyle } from '@master/style';
import { BEFORE, BREAK, DASH } from './constants/css-property-keyword';

export class BreakBeforeStyle extends MasterStyle {
    static override properties = [BREAK + DASH + BEFORE];
}