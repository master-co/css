import { DASH, OUTLINE, WIDTH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineWidthStyle extends Style {
    static override properties = [OUTLINE + DASH + WIDTH];
}