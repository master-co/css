import { Style } from '@master/style';
import { AFTER, BREAK, DASH } from './constants/css-property-keyword';

export class BreakAfter extends Style {
    static override key = BREAK + DASH + AFTER;
}