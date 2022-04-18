import { Style } from '@master/style';
import { BEFORE, BREAK, DASH } from './constants/css-property-keyword';

export class BreakBefore extends Style {
    static override key = BREAK + DASH + BEFORE;
}