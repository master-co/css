export type NativeLoadFailureCode = 'NATIVE_UNAVAILABLE' | 'NATIVE_LOAD_FAILED'

export class NativeBindingError extends Error {
  constructor(
    public readonly code: NativeLoadFailureCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'NativeBindingError'
  }
}
