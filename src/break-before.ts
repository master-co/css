import { Style } from '@master/style';
import { BEFORE, BREAK, DASH } from './constants/css-property-keyword';

export class BreakBeforeStyle extends Style {
    static override properties = [BREAK + DASH + BEFORE];
}