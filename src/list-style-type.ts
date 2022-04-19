import { dash, LIST, STYLE, TYPE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStyleType extends Style {
    static override matches = /^list-style:(none|disc|decimal)(?!;)/;
    static override key = dash(LIST, STYLE, TYPE);
}