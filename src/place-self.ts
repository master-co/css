import { DASH, PLACE, SELF } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceSelfStyle extends Style {
    static override properties = [PLACE + DASH + SELF];
}