import { ALIGN, DASH, ITEMS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignItems extends Style {
    static override key = ALIGN + DASH + ITEMS;
}