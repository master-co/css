export function quoteDiagnosticValue(value: string) {
  return JSON.stringify(value)
}

export function formatClassName(className: string) {
  return quoteDiagnosticValue(className)
}

export function formatClassList(classNames: string[] | string) {
  return quoteDiagnosticValue(Array.isArray(classNames) ? classNames.join(' ') : classNames)
}

export function formatReason(reason: string) {
  const normalized = reason.trim()
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`
}
