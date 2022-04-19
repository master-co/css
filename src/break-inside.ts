import { Style } from '@master/style';
import { BREAK, DASH, INSIDE } from './constants/css-property-keyword';

export class BreakInside extends Style {
    static override key = BREAK + DASH + INSIDE;
}