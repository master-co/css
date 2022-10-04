import { MasterCSSRule } from '../rule';

export class AccentColor extends MasterCSSRule {
    static override key = 'accentColor';
    static override colorStarts = 'accent:';
    static override colorful = true;
}