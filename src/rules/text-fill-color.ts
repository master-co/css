import { MasterCSSRule } from '../rule';

export class TextFillColor extends MasterCSSRule {
    static id = 'textFillColor';
    static override matches = /^text-fill-color:./;
    static override colorStarts = '(text-fill|text):';
    static override colorful = true;
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': propertyInfo
        };
    }
}