export interface CompilerDiagnosticRecorder {
    time<T>(metricId: string, callback: () => T): T;
    addCount(metricId: string, value?: number): void;
    setCount(metricId: string, value: number): void;
}
export declare function timeCompilerDiagnostic<T>(diagnostics: CompilerDiagnosticRecorder | undefined, metricId: string, callback: () => T): T;
export declare function addCompilerDiagnosticCount(diagnostics: CompilerDiagnosticRecorder | undefined, metricId: string, value?: number): void;
export declare function setCompilerDiagnosticCount(diagnostics: CompilerDiagnosticRecorder | undefined, metricId: string, value: number): void;
