/**
 * Returns the object type of the given payload
 *
 * @param {*} payload
 * @returns {string}
 */
export function getType(payload: any): string {
    return Object.prototype.toString.call(payload).slice(8, -1)
}
