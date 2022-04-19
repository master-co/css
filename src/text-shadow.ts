import { Style } from '@master/style';
import { dash, SHADOW, TEXT } from './constants/css-property-keyword';

export class TextShadow extends Style {
    static override key = dash(TEXT, SHADOW);
}