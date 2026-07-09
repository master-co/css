import type { Variable } from '@master/css-schema/css-syntax'

function formatAlphaPercentage(value: number) {
  return String(Object.is(value, -0) ? 0 : value).replace(/^(-?)0\./, '$1.') + '%'
}

export function normalizeEngineVariableValue(value: string | number) {
  return typeof value === 'number'
    ? String(value)
    : value.replace(/\|/g, ' ')
}

export function createCSSVariableReference(name: string, alpha?: number, fallback?: string) {
  const reference = `var(--${name}${fallback ? ',' + fallback : ''})`
  return alpha !== undefined
    ? createAlphaColorValue(reference, alpha)
    : reference
}

export function createAlphaColorValue(value: string, alpha: number) {
  return `color-mix(in oklab,${value} ${formatAlphaPercentage(alpha * 100)},transparent)`
}

export function createNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
  void unit
  void rootSize
  return createCSSVariableReference(variable.name)
}

export function createNegativeNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
  const reference = createCSSVariableReference(variable.name)
  void variable
  void unit
  void rootSize
  return `calc(${reference} * -1)`
}
