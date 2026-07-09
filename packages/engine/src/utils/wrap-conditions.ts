export default function wrapConditions(text: string, conditions?: string[]) {
  if (!conditions?.length) return text
  for (let index = conditions.length - 1; index >= 0; index--) {
    const condition = conditions[index]?.trim()
    if (condition) text = `${condition}{${text}}`
  }
  return text
}
