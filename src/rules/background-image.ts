import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, IMAGE } from '../constants/css-property-keyword';

export class BackgroundImage extends MasterCSSRule {
    static override matches = /^(bg|background):(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/;
    static override key = dash(BACKGROUND, IMAGE);
    static override colorful = true;
}