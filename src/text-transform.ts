import { DASH, TEXT, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextTransformStyle extends Style {
    static override matches = /^(t-transform:.|t(ext)?:(uppercase|lowercase|capitalize)(?!;))/;
    static override key = TEXT + DASH + TRANSFORM;
}