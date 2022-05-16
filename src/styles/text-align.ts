import { ALIGN, dash, TEXT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextAlign extends Style {
    static override matches = /^t(ext)?:(justify|center|left|right|start|end)(?!;)/;
    static override key = dash(TEXT, ALIGN);
}