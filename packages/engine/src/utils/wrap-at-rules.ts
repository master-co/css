export default function wrapAtRules(text: string, atRules?: string[]) {
  if (!atRules?.length) return text
  for (let index = atRules.length - 1; index >= 0; index--) {
    const atRule = atRules[index]?.trim()
    if (atRule) text = `${atRule}{${text}}`
  }
  return text
}
