import { DASH, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextOrientationStyle extends Style {
    static override matches = /^(t(ext)?-orientation:.|t(ext)?:(mixed|upright|sideways-right|sideways|use-glyph-orientation)(?!;))/;
    static override key = TEXT + DASH + 'orientation';
}