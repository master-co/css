
export default function getTemplateElementSuffix(text, raw) {
    if (text.indexOf(raw) === -1) {
        return ''
    }
    return text.split(raw).pop()
}