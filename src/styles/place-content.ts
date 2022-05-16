import { CONTENT, dash, PLACE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class PlaceContent extends Style {
    static override key = dash(PLACE, CONTENT);
    override order = -1;
}