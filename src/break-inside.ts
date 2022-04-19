import { Style } from '@master/style';
import { BREAK, dash, INSIDE } from './constants/css-property-keyword';

export class BreakInside extends Style {
    static override key = dash(BREAK, INSIDE);
}