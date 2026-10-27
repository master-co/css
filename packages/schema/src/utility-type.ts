export const UtilityType = {
  /**
   * semantic utility classes
   * @example sr-only, text-sm
   */
  Semantic: -2,
  /**
   * normal
   * @example p-md, font-size:1rem
   */
  Normal: 0,
} as const

export type UtilityType = typeof UtilityType[keyof typeof UtilityType]
