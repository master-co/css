import { Style } from '@master/style';
import { AFTER, BREAK, dash } from './constants/css-property-keyword';

export class BreakAfter extends Style {
    static override key = dash(BREAK, AFTER);
}