import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'BackgroundColor'
    static override colorStarts = '(bg|background):';
    static override propName = 'background-color';
    static override unit = '';
    static override colorful = true;
}