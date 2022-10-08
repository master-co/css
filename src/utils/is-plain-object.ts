import { getType } from './get-type'

export type PlainObject = Record<string | number | symbol, any>

/**
 * Returns whether the payload is a plain JavaScript object (excluding special classes or objects with other prototypes)
 *
 * @param {*} payload
 * @returns {payload is PlainObject}
 */
export function isPlainObject(payload: any): payload is PlainObject {
    if (getType(payload) !== 'Object') return false
    return payload.constructor === Object && Object.getPrototypeOf(payload) === Object.prototype
}