// Engine behavior that a later phase of the JS runtime engine plan implements. The
// session throws before changing any state, so the differential harness can skip the
// input instead of reporting a divergence. Nothing throws this once J4 lands.

export type PendingPhase = 'J3' | 'J4'

export class PendingFeatureError extends Error {
  constructor(readonly phase: PendingPhase, readonly feature: string) {
    super(`${feature} is not implemented yet (${phase})`)
  }
}

export function pending(phase: PendingPhase, feature: string): never {
  throw new PendingFeatureError(phase, feature)
}
