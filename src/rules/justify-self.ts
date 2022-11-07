import Rule from '../rule'

export default class extends Rule {
    static override id = 'JustifySelf'
    static override matches =  /^js:./
}