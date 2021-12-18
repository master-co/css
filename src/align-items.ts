import { ALIGN, DASH, ITEMS } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignItemsStyle extends Style {
    static override key = ALIGN + DASH + ITEMS;
}