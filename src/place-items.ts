import { CONTENT, DASH, ITEMS, PLACE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceItemsStyle extends Style {
    static override property = PLACE + DASH + ITEMS;
}