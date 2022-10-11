import { MasterCSSRule } from '../rule';

export class TextFillColor extends MasterCSSRule {
    static override matches = /^text-fill-color:./;
    static override colorStarts = '(text-fill|text|t):';
    static override colorful = true;
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        };
    }
}