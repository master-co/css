import { MasterCSSRule } from '../rule';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export class BorderImageSource extends MasterCSSRule {
    static override matches = /^border-image:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)(?:(?!\|).)*$/;
    static override propName = dash(BORDER, IMAGE, 'source');
}