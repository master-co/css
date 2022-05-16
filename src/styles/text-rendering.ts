import { Style } from '../style';
import { dash, TEXT } from '../constants/css-property-keyword';

export class TextRendering extends Style {
    static override matches = /^t(ext)?:(optimizeSpeed|optimizeLegibility|geometricPrecision)(?!;)/;
    static override key = dash(TEXT, 'rendering');
}