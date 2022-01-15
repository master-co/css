import { ALIGN, DASH, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextAlignStyle extends Style {
    static override matches =  /^t(ext)?:(justify|center|left|right|start|end)(?!;)/;
    static override key = TEXT + DASH + ALIGN;
}