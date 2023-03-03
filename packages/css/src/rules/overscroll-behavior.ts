import { Rule } from '../'

export class OverscrollBehavior extends Rule {
    static override id = 'OverscrollBehavior' as const
    static override matches = '^overscroll-behavior(?:-[xy])?:'
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
        case 'x':
            return { 'overscroll-behavior-x': declaration }
        case 'y':
            return { 'overscroll-behavior-y': declaration }
        default:
            return { 'overscroll-behavior': declaration }
        }
    }
}