import { concatArrays } from '../utils/concat-arrays'
import { isPlainObject } from '../utils/is-plain-object'
import { isSymbol } from '../utils/is-symbol'

function assignProp(
    carry: Record<string, any>,
    key: string,
    newVal: any,
    originalObject: Record<string, any>
): void {
    const propType = {}.propertyIsEnumerable.call(originalObject, key)
        ? 'enumerable'
        : 'nonenumerable'
    if (propType === 'enumerable') carry[key] = newVal
    if (propType === 'nonenumerable') {
        Object.defineProperty(carry, key, {
            value: newVal,
            enumerable: false,
            writable: true,
            configurable: true,
        })
    }
}

function mergeRecursively<
    T1 extends Record<string, any> | any,
    T2 extends Record<string, any> | any
>(
    origin: T1,
    newComer: T2,
    compareFn?: (prop1: any, prop2: any, propName: string) => any
): (T1 & T2) | T2 {
    // always return newComer if its not an object
    if (!isPlainObject(newComer)) return newComer
    // define newObject to merge all values upon
    let newObject = {} as (T1 & T2) | T2
    if (isPlainObject(origin)) {
        const props = Object.getOwnPropertyNames(origin)
        const symbols = Object.getOwnPropertySymbols(origin)
        newObject = [...props, ...symbols].reduce((carry, key) => {
            const targetVal = origin[key as string]
            if (
                (!isSymbol(key) && !Object.getOwnPropertyNames(newComer).includes(key)) ||
                (isSymbol(key) && !Object.getOwnPropertySymbols(newComer).includes(key))
            ) {
                assignProp(carry as Record<string, any>, key as string, targetVal, origin)
            }
            return carry
        }, {} as (T1 & T2) | T2)
    }
    // newObject has all properties that newComer hasn't
    const props = Object.getOwnPropertyNames(newComer)
    const symbols = Object.getOwnPropertySymbols(newComer)
    const result = [...props, ...symbols].reduce((carry, key) => {
        // re-define the origin and newComer as targetVal and newVal
        let newVal = newComer[key as string]
        const targetVal = isPlainObject(origin) ? origin[key as string] : undefined
        // When newVal is an object do the merge recursively
        if (targetVal !== undefined && isPlainObject(newVal)) {
            newVal = mergeRecursively(targetVal, newVal, compareFn)
        }
        const propToAssign = compareFn ? compareFn(targetVal, newVal, key as string) : newVal
        assignProp(carry as Record<string, any>, key as string, propToAssign, newComer)
        return carry
    }, newObject)
    return result
}

type ExpandDeep<T> =
    T extends Record<string | number | symbol, unknown>
    ? { [K in keyof T]: ExpandDeep<T[K]> }
    : T extends Array<infer E>
    ? Array<ExpandDeep<E>>
    : T

export function extend<T extends Record<string, any>, Tn extends Record<string, any>[]>(
    object: T,
    ...otherObjects: Tn
): ExpandDeep<any> {
    return otherObjects
        .filter((newComer) => isPlainObject(newComer))
        .reduce((result, newComer) => {
            return mergeRecursively(result, newComer, concatArrays)
        }, object) as any
}