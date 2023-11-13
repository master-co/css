
export default function getTemplateElementPrefix(text, raw) {
    const idx = text.indexOf(raw)
    if (idx === 0) {
        return ''
    }
    return text.split(raw).shift()
}