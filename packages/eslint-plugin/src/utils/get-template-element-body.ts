export default function getTemplateElementBody(text, prefix, suffix) {
    let arr = text.split(prefix)
    arr.shift()
    const body = arr.join(prefix)
    arr = body.split(suffix)
    arr.pop()
    return arr.join(suffix)
}