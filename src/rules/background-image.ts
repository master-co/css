import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, IMAGE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundImage'
    static override matches = /^(bg|background):(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!\|).)*$/;
    static override propName = dash(BACKGROUND, IMAGE);
    static override colorful = true;
}