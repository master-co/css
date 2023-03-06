import { RuleConfig } from '../rule'

export const overscrollBehavior: RuleConfig = {
    matches: '^overscroll-behavior(?:-[xy])?:',
    prop: false,
    get(declaration): { [key: string]: any } {
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