import { DASH, LIST, STYLE, TYPE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStyleTypeStyle extends Style {
    static override matches = /^list-style:(none|disc|decimal)(?!;)/;
    static override key = LIST + DASH + STYLE + DASH + TYPE;
}