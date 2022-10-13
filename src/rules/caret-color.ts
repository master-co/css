import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'CaretColor'
    static override propName = 'caret-color'
    static override colorStarts = 'caret:';
    static override colorful = true;
}