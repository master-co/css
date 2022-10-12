import { COLOR, dash, DECORATION, TEXT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TextDecorationColor'
    static override propName = dash(TEXT, DECORATION, COLOR);
    static override colorStarts = 'text-decoration:';
    static override colorful = true;
}