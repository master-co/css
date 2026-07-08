export const UtilityType = {
  /**
   * semantic utility classes
   * @example block, inline
   */
  Semantic: -2,
  /**
   * shorthand
   * @example border, padding, margin
   */
  Shorthand: -1,
  /**
   * normal
   * @example grid-cols
   */
  Normal: 0,
} as const

export type UtilityType = typeof UtilityType[keyof typeof UtilityType]

export default UtilityType
