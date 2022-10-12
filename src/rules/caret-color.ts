import { MasterCSSRule } from '../rule';
import { CARET, COLOR, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'CaretColor'
    static override propName = dash(CARET, COLOR);
    static override colorStarts = 'caret:';
    static override colorful = true;
}