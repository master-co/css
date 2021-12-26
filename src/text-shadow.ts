import { Style } from '@master/style';
import { DASH, SHADOW, TEXT } from './constants/css-property-keyword';

export class TextShadowStyle extends Style {
    static override matches = /^t(ext)?-shadow:/;
    static override key = TEXT + DASH + SHADOW;
}