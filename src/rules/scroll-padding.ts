import Rule from '../rule'

export default class extends Rule {
    static override id = 'ScrollPadding'
    static override matches = /^scroll-p([xytblr]|adding(-(top|bottom|left|right))?)?:./
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        if (this.prefix.slice(-3, -2) === 'p') {

            switch (this.prefix.slice(-2, -1)) {
            case 'x':
                return {
                    'scroll-padding-left': declaration,
                    'scroll-padding-right': declaration
                }
            case 'y':
                return {
                    'scroll-padding-top': declaration,
                    'scroll-padding-bottom': declaration
                }
            case 'l':
                return {
                    'scroll-padding-left': declaration
                }
            case 'r':
                return {
                    'scroll-padding-right': declaration
                }
            case 't':
                return {
                    'scroll-padding-top': declaration
                }
            case 'b':
                return {
                    'scroll-padding-bottom': declaration
                }
            }
        } else {
            return {
                [this.prefix.replace(/-p(?!adding)/, '-' + 'padding').slice(0, -1)]: declaration
            }
        }
    }
    override get order(): number {
        return (this.prefix === 'scroll-padding:' || this.prefix === 'scroll-p:') ? -1 : 0
    }
}