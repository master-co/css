import { CONTENT, DASH, PLACE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class PlaceContentStyle extends Style {
    static override key = PLACE + DASH + CONTENT;
    override get getOrder(): number {
        return -1;
    }
}