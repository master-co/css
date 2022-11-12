import Rule from '../rule'

export default class extends Rule {
    static override id: 'AnimationIterationCount' = 'AnimationIterationCount' as const
    static override matches = /^@iteration-count:./
    static override unit = ''
}