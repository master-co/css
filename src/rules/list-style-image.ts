import { dash, IMAGE, LIST, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ListStyleImage extends MasterCSSRule {
    static override matches = /^list-style:(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/;
    static override propName = dash(LIST, STYLE, IMAGE);
}