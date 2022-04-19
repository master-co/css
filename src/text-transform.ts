import { dash, TEXT, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextTransform extends Style {
    static override matches = /^t(ext)?:(uppercase|lowercase|capitalize)(?!;)/;
    static override key = dash(TEXT, TRANSFORM);
}