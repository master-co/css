import { dash, PLACE, SELF } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceSelf extends Style {
    static override key = dash(PLACE, SELF);
    override order = -1;
}