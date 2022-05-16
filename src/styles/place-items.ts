import { dash, ITEMS, PLACE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceItems extends Style {
    static override key = dash(PLACE, ITEMS);
    override order = -1;
}