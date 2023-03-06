import { Rule } from '../rule'

export class AnimationIterationCount extends Rule {
    static override id = 'AnimationIterationCount' as const
    static override matches = '^@iteration-count:.'
    static override unit = ''
}