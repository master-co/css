import { Style } from '@master/style';
import { BEFORE, BREAK, dash } from './constants/css-property-keyword';

export class BreakBefore extends Style {
    static override key = dash(BREAK, BEFORE);
}