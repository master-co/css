import { MasterCSSRule } from '../rule';

export class AccentColor extends MasterCSSRule {
    static override key = 'accent-color';
    static override colorStarts = 'accent:';
    static override colorful = true;
}