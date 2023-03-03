import { Rule } from '../'

export default class extends Rule {
    static override id = 'JustifyItems' as const
    static override matches =  '^ji:.'

}