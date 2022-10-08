export function concatArrays(originVal: any, newVal: any): any | any[] {
    if (Array.isArray(originVal) && Array.isArray(newVal)) {
        // concat logic
        return originVal.concat(newVal)
    }
    return newVal // always return newVal as fallback!!
}