import { CONTENT, DASH, PLACE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceContentStyle extends Style {
    static override property = PLACE + DASH + CONTENT;
}