import { CONTENT, DASH, ITEMS, PLACE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class PlaceItemsStyle extends MasterStyle {
    static override properties = [PLACE + DASH + ITEMS];
}