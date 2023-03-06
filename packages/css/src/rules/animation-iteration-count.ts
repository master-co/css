import { Rule } from '../rule'

export class AnimationIterationCount extends Rule {
    static id = 'AnimationIterationCount' as const
    static matches = '^@iteration-count:.'
    static unit = ''
}