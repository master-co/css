// The parser's cooked value is authoritative. This adapter maps UTF-16 spans
// through JavaScript literal syntax; class tokenization and lint policy stay in Rust.
export function javascriptLiteralRange(raw: string, cooked: string) {
  const starts: number[] = []
  const ends: number[] = []
  for (let index = 0; index < raw.length;) {
    const start = index++
    let width = 1
    if (raw[start] === '\\') {
      const character = raw[index++]
      if (character === '\r' || character === '\n' || character === '\u2028' || character === '\u2029') {
        if (character === '\r' && raw[index] === '\n') index++
        width = 0
      } else if (character === 'u') {
        if (raw[index] === '{') {
          const end = raw.indexOf('}', index + 1)
          if (end === -1) return
          width = Number.parseInt(raw.slice(index + 1, end), 16) > 0xffff ? 2 : 1
          index = end + 1
        } else index += 4
      } else if (character === 'x') index += 2
      else if (/[0-7]/.test(character)) {
        const limit = character <= '3' ? 2 : 1
        for (let count = 0; count < limit && /[0-7]/.test(raw[index] ?? ''); count++) index++
      }
    } else if (raw[start] === '\r' && raw[index] === '\n') {
      // Template literal CRLF becomes one cooked LF.
      index++
    }
    if (index > raw.length) return
    for (let unit = 0; unit < width; unit++) {
      starts.push(start)
      ends.push(index)
    }
  }
  if (starts.length !== cooked.length) return
  return (start: number, end: number): [number, number] => {
    const rawStart = starts[start] ?? raw.length
    return [rawStart, start === end ? rawStart : (ends[end - 1] ?? raw.length)]
  }
}

export function encodeJavaScriptLiteral(text: string, quote: string) {
  let result = ''
  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    const code = text.charCodeAt(index)
    if (character === '\\' || character === quote || (quote === '`' && character === '$' && text[index + 1] === '{')) {
      result += '\\' + character
    } else if (character === '\t' || (quote === '`' && (character === '\n' || character === '\r'))) {
      result += character
    } else if (code < 0x20 || code === 0x2028 || code === 0x2029 || (code >= 0xd800 && code <= 0xdfff)) {
      result += '\\u' + code.toString(16).padStart(4, '0')
    } else result += character
  }
  return result
}
