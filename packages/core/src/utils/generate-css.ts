import createCSS from '../create'

export default function generateCSS(classes: string[], css = createCSS()) {
    let text = ''
    css.add(...classes)
    text = css.text
    css.remove(...classes)
    return text
}