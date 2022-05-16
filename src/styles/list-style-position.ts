import { dash, LIST, POSITION, STYLE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class ListStylePosition extends Style {
    static override matches = /^list-style:(inside|outside)(?!;)/;
    static override key = dash(LIST, STYLE, POSITION);
}