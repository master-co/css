import { OUTLINE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Outline extends Style {
    static override key = OUTLINE;
    override order = -1;
}