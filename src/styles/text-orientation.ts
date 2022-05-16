import { dash, TEXT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextOrientation extends Style {
    static override matches = /^t(ext)?:(mixed|upright|sideways-right|sideways|use-glyph-orientation)(?!;)/;
    static override key = dash(TEXT, 'orientation');
}