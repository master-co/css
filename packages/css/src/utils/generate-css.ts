import MasterCSS from '../core'

export default function generateCSS(classes: string[], css = new MasterCSS()) {
    let text = ''
    css.add(...classes)
    text = css.text
    css.delete(...classes)
    return text
}