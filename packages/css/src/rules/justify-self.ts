import { Rule } from '../'

export default class extends Rule {
    static override id = 'JustifySelf' as const
    static override matches =  '^js:.'
}