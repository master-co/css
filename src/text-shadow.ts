import { Style } from '@master/style';
import { DASH, SHADOW, TEXT } from './constants/css-property-keyword';

export class TextShadow extends Style {
    static override key = TEXT + DASH + SHADOW;
}