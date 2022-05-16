import { Style } from '../style';
import { AFTER, BREAK, dash } from '../constants/css-property-keyword';

export class BreakAfter extends Style {
    static override key = dash(BREAK, AFTER);
}