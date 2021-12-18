import { DASH, LIST, POSITION, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStylePositionStyle extends Style {
    static override key = LIST + DASH + STYLE + DASH + POSITION;
}