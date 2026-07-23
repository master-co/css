export function freezeToolingResult<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }
  for (const nested of Object.values(value)) {
    freezeToolingResult(nested)
  }
  return Object.freeze(value)
}
