import { DASH, PLACE, SELF } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceSelf extends Style {
    static override key = PLACE + DASH + SELF;
    override order = -1;
}