import { Style } from '../style';
import { BACKGROUND } from '../constants/css-property-keyword';

export class Background extends Style {
    static override matches = /^bg:./;
    static override key = BACKGROUND;
    static override colorful = true;
    override order = -1;
}