import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ScrollMargin'
    static override matches = /^scroll-m([xytblr]|argin(-(top|bottom|left|right))?)?:./;
    override get(declaration): { [key: string]: any } {
        if (this.prefix.slice(-3, -2) === 'm') {
            switch (this.prefix.slice(-2, -1)) {
                case 'x':
                    return {
                        'scroll-margin-left': declaration,
                        'scroll-margin-right': declaration
                    }
                case 'y':
                    return {
                        'scroll-margin-top': declaration,
                        'scroll-margin-bottom': declaration
                    }
                case 'l':
                    return {
                        'scroll-margin-left': declaration
                    }
                case 'r':
                    return {
                        'scroll-margin-right': declaration
                    }
                case 't':
                    return {
                        'scroll-margin-top': declaration
                    }
                case 'b':
                    return {
                        'scroll-margin-bottom': declaration
                    }
            }
        } else {
            return {
                [this.prefix.replace(/-m(?!argin)/, '-' + 'margin').slice(0, -1)]: declaration
            }
        }
    }
    override get order(): number {
        return (this.prefix === 'scroll-margin:' || this.prefix === 'scroll-m:') ? -1 : 0;
    }
}