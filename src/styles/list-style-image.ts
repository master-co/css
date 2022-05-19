import { dash, IMAGE, LIST, STYLE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class ListStyleImage extends Style {
    static override matches = /^list-style:(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/;
    static override key = dash(LIST, STYLE, IMAGE);
}