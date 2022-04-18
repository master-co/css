import { DASH, LIST, POSITION, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStylePosition extends Style {
    static override matches = /^list-style:(inside|outside)(?!;)/;
    static override key = LIST + DASH + STYLE + DASH + POSITION;
}