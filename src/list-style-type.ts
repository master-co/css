import { DASH, LIST, STYLE, TYPE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStyleTypeStyle extends Style {
    static override properties = [LIST + DASH + STYLE + DASH + TYPE];
}