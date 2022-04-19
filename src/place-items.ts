import { DASH, ITEMS, PLACE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceItems extends Style {
    static override key = PLACE + DASH + ITEMS;
    override order = -1;
}