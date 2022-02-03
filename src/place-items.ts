import { DASH, ITEMS, PLACE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceItemsStyle extends Style {
    static override key = PLACE + DASH + ITEMS;
    override getOrder = -1;
}