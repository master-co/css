import Rule from '../rule'

export default class extends Rule {
    static override id = 'AnimationIterationCount'
    static override matches = /^@iteration-count:./
    static override unit = ''
}