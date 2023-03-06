import { Rule } from '../rule'

export class Gap extends Rule {
    static id = 'Gap' as const
    static matches = '^gap(?:-x|-y)?:.'
    static get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        switch (this.prefix[4]) {
        case 'x':
            return { 'column-gap': declaration }
        case 'y':
            return { 'row-gap': declaration }
        default:
            return { gap: declaration }
        }
    }
    override order = -1
}