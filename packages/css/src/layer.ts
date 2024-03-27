const enum Layer {
    /**
     * utility classes
     * @example block, inline
     */
    Utility = -4,
    /**
     * native shorthand
     * @example border, padding, margin
     */
    NativeShorthand = -3,
    /**
     * shorthand
     * @example px, py, mx, my
     */
    Shorthand = -2,
    /**
     * native properties
     * @example color, background-color, font-size
     */
    Native = -1,
    /**
     * normal
     * @example grid-cols
     */
    Normal = 0,
}

export default Layer