import { DASH, LIST, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStyleStyle extends Style {
    static override key = LIST + DASH + STYLE;
    override order = -1;
}