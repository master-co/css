export interface CompilerDiagnosticRecorder {
  time<T>(metricId: string, callback: () => T): T
  addCount(metricId: string, value?: number): void
  setCount(metricId: string, value: number): void
}

export function timeCompilerDiagnostic<T>(
  diagnostics: CompilerDiagnosticRecorder | undefined,
  metricId: string,
  callback: () => T
): T {
  return diagnostics
    ? diagnostics.time(metricId, callback)
    : callback()
}

export function addCompilerDiagnosticCount(
  diagnostics: CompilerDiagnosticRecorder | undefined,
  metricId: string,
  value = 1
) {
  diagnostics?.addCount(metricId, value)
}

export function setCompilerDiagnosticCount(
  diagnostics: CompilerDiagnosticRecorder | undefined,
  metricId: string,
  value: number
) {
  diagnostics?.setCount(metricId, value)
}
