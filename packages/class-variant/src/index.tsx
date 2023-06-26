import line from '@techor/one-liner'

type Param<T> = string 
    | string[]
    | Record<string, boolean>
    | [string, { [key in keyof T]?: T[key] }]
    | { [key in keyof T]?: T[key] extends boolean | undefined ? string : Record<string, string> }
    | ((valueByProp: T) => any)
type ReturnType<T> = { default?: Partial<T> } & ((valueByProp?: T) => string) 

/**
 * 1. 'inline-flex rounded'
 * 2. ['inline-flex', 'rounded']
 * 3. { 'bg:red': true, 'fg:30': false }
 * 4. ['uppercase', { intent: 'primary', size: 'md' }]
 * 5. { intent: { primary: 'bg:blue-50 fg:white', secondary: 'bg:white fg:gray-80' }, size: { sm: 'font:20 py:1 px:2', md: 'font:16 py:2 px:4' }, disabled: 'opacity:.5' }
 * 6. ({ $intent, $size }) => $intent && $size && 'font:italic'
 */
function cv<T extends Record<string, string | number | boolean>>(...params: Array<Param<T>>): ReturnType<T>
function cv<T extends Record<string, string | number | boolean>>(firstParam: TemplateStringsArray, ...params: Array<Param<T>>): ReturnType<T>
function cv<T extends Record<string, string | number | boolean>>(firstParam: TemplateStringsArray | Param<T>, ...params: Array<Param<T>>): ReturnType<T> {
    return function getClassNames(valueByProp: T = {} as any) {
        const mergedValueByProp = Object.assign({}, getClassNames['default'], valueByProp)
        const classesConditions: [string, Record<string, string | number | boolean>][] = []
        const valuesByProp: Record<string, Record<string, string>> = {}
        const classesByBooleanProp: Record<string, string> = {}
        const handledParams = []
        const handleParam = (param: Param<T>) => {
            switch (typeof param) {
                case 'object':
                    if (typeof param === 'object') {
                        if (Array.isArray(param)) {
                            const newClassesByCondition = param[1]
                            if (newClassesByCondition && typeof newClassesByCondition === 'object') {
                                handledParams.push(param)
        
                                const keys = Object.keys(newClassesByCondition)
            
                                let duplicated = false
                                for (const eachClassesByCondition of classesConditions) {
                                    const entries = Object.entries(eachClassesByCondition[1])
                                    if (
                                        entries.length === keys.length
                                        && entries.every(([key, value]) => keys.includes(key) && newClassesByCondition[key] === value)
                                    ) {
                                        duplicated = true
                                        eachClassesByCondition[0] = param[0]
                                        break
                                    }
                                }
            
                                if (!duplicated) {
                                    classesConditions.push(param as any)
                                }
                            }
                        } else {
                            const keys = Object.keys(param)
                            if (keys.length) {
                                switch (typeof param[keys[0]]) {
                                    case 'object':
                                    case 'string':
                                        handledParams.push(param)

                                        for (const eachProp of keys) {
                                            const value = param[eachProp]
                                            switch (typeof value) {
                                                case 'object':
                                                    if (eachProp in valuesByProp) {
                                                        const classesByPropValue = valuesByProp[eachProp]
                                                        for (const eachPropValue in value) {
                                                            classesByPropValue[eachPropValue] = value[eachPropValue] as string
                                                        }
                                                    } else {
                                                        valuesByProp[eachProp] = value
                                                    }
                                                    break
                                                case 'string':
                                                    classesByBooleanProp[eachProp] = value
                                                    break
                                            }
                                        }
                                        break
                                } 
                            } else {
                                handledParams.push(param)
                            }
                        }
                    }
                    break
                case 'function':
                    // eslint-disable-next-line no-case-declarations
                    const transformedParam = param(mergedValueByProp)
                    if (typeof transformedParam === 'object') {
                        handledParams.push(param)
                        handleParam(transformedParam)
                    }
                    break
            }
        }

        if (Array.isArray(firstParam) && 'raw' in firstParam) {
            handleParam(firstParam)
        }
        for (const eachParam of params) {
            handleParam(eachParam)
        }
    
        const classNames = [
            line(
                handledParams.includes(firstParam)
                    ? ''
                    : firstParam, 
                ...params.map(eachParam => handledParams.includes(eachParam)
                    ? ''
                    : typeof eachParam === 'function'
                        ? eachParam(mergedValueByProp) || ''
                        : eachParam)
            )
        ]
        for (const eachClassesByCondition of classesConditions) {
            if (
                Object.entries(eachClassesByCondition[1]).every(([prop, value]) => {
                    const propValue = mergedValueByProp[prop] ?? mergedValueByProp['$' + prop]
                    return value === propValue || value === false && propValue === undefined
                })
            ) {
                classNames.push(eachClassesByCondition[0])
            }
        }
    
        for (const eachProp in valuesByProp) {
            const value = mergedValueByProp[eachProp] ?? mergedValueByProp['$' + eachProp] ?? ''
            const classes = valuesByProp[eachProp][value]
            if (classes) {
                classNames.push(classes)
            }
        }

        for (const eachProp in classesByBooleanProp) {
            const value = mergedValueByProp[eachProp] ?? mergedValueByProp['$' + eachProp]
            if (value) {
                classNames.push(classesByBooleanProp[eachProp])
            }
        }
    
        return line(classNames)
    }
}

export default cv