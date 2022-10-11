import { MasterCSSRule } from '../rule';

export class TextStroke extends MasterCSSRule {
    static override matches = /^text-stroke:./;
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        };
    }
}