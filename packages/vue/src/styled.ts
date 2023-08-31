import { h, defineComponent, type VNode } from 'vue'
import cv from 'class-variant'
import line from '@techor/one-liner'
import { extend } from '@techor/extend'

type IfEquals<X, Y, A=X, B=never> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) 
    ? A 
    : B
type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<
        { [Q in P]: T[P];}, 
        { -readonly [Q in P]: T[P] }, 
        P
    >
}[keyof T];
type WritableObject<T> = {
    [key in WritableKeys<T>]: T[key]
}

type HTMLElementTagNameKeys = keyof HTMLElementTagNameMap

type BaseType<E> = string
    | string[]
    | Record<string, boolean>
    | (
        E extends Array<any>
            ? never
            : [string, { [key in keyof E]?: E[key] }]
                | { [key in keyof E]?: E[key] extends boolean | undefined ? string : Record<string, string> }
    )
type BaseLoopType<E> = BaseType<E> | Array<BaseType<E>>
type TagParams = Array<[TemplateStringsArray, any[]]>;
type ParamType<K extends HTMLElementTagNameKeys | VNode, E extends object = object> = ((props: MasterComponentProps<K, E>) => BaseLoopType<MasterComponentProps<K, E>> | undefined) | BaseLoopType<MasterComponentProps<K, E>>
type ParamsType<K extends HTMLElementTagNameKeys | VNode, E extends object = object> = Array<ParamType<K, E>>;
type MasterComponentProps<K extends HTMLElementTagNameKeys | VNode, E extends object = object> = 
    Partial<E>
    & { className?: BaseLoopType<E> | undefined, [key: string]: any }
    & (
        K extends HTMLElementTagNameKeys 
            ? Partial<Omit<WritableObject<HTMLElementTagNameMap[K]>, 'className'>>
            : object
    )
type MasterComponent<K extends HTMLElementTagNameKeys | VNode, E extends object = object> = ((props: MasterComponentProps<K, E>) => any) & { setup?: any, tag?: K, params: TagParams };
type ReturnType<K extends HTMLElementTagNameKeys | VNode, E extends object = object> = <F extends TemplateStringsArray | MasterComponent<any> | VNode | BaseType<E>>(
    firstParam: F,
    ...params: F extends MasterComponent<any, any>
        ? never
        : ParamsType<K, E>
) => F extends MasterComponent<any, any> | VNode
    ? ReturnType<K, E>
    : MasterComponent<K, E>

export const styled: {
    [K in HTMLElementTagNameKeys]: ((firstParam: TemplateStringsArray | ParamType<K>, ...params: ParamsType<K>) => MasterComponent<K, object>)
    & (<E extends object>(firstParam: TemplateStringsArray | ParamType<K, E>, ...params: ParamsType<K, E>) => MasterComponent<K, E>)
    & (<F extends MasterComponent<any>, E extends object = object>(firstParam: F) => F extends MasterComponent<any, infer ME> ? ReturnType<K, ME & E> : never)
    & (<F extends VNode, E extends object = object>(firstParam: F) => ReturnType<K, E>)
} & {
    <F extends MasterComponent<any>, E extends object = object>(firstParam: F): F extends MasterComponent<infer K, infer ME> ? ReturnType<K, ME & E> : never
} & {
    <F extends VNode, E extends object = object>(firstParam: F): ReturnType<F, E>
} & {
    (firstParam: TemplateStringsArray | ParamType<'div'>, ...params: ParamsType<'div'>): MasterComponent<'div'>
} & {
    <E extends object = object>(firstParam: TemplateStringsArray | ParamType<'div', E>, ...params: ParamsType<'div', E>): MasterComponent<'div', E>
} = new Proxy(
    // @ts-ignore
    ((firstParam, ...params) => {
        return (
            Array.isArray(firstParam) && 'raw' in firstParam 
            || typeof firstParam !== 'object' 
            || !('setup' in firstParam) && !('__v_isVNode' in firstParam)
        )
            ? styled.div(firstParam as any, ...params)
            : handle(firstParam.tag ?? firstParam, firstParam.params)
    }) as any,
    {
        get: function (target, tagName: HTMLElementTagNameKeys) {
            if (!(tagName in target)) {
                target[tagName] = handle(tagName, undefined)
            }
            return target[tagName]
        }
    }
)

function handle<K extends string | VNode, E extends object = object>(tag: K, tagParams: TagParams | undefined) {
    // @ts-ignore
    return (...params: any[]) => {
        const generateComponent = (defaultClassNames: TemplateStringsArray, ...params: any[]) => {
            const newTagParams: TagParams = [...(tagParams || []), [defaultClassNames, params]]
            const Component = defineComponent<MasterComponentProps<any, E>>(
                (props, { slots, attrs }) => {
                    return () => {
                        const classNames: string[] = []
                        const classesConditions: [string, Record<string, string | number | boolean>][] = []
                        let valuesByProp: Record<string, string | Record<string, string>>
                        const unhandledTagParams: TagParams = []
                        const mergedProps = Object.assign({}, typeof tag === 'string' ? {} : tag.props, attrs)
                        
                        const handleParam = (param: any) => {
                            switch (typeof param) {
                                case 'object':
                                    if (Array.isArray(param)) {
                                        const newClassesByCondition = param[1]
                                        if (newClassesByCondition && typeof newClassesByCondition === 'object') {
                                            const keys = Object.keys(newClassesByCondition)
                                            for (const eachClassesByCondition of classesConditions) {
                                                const entries = Object.entries(eachClassesByCondition[1])
                                                if (
                                                    entries.length === keys.length
                                                    && entries.every(([key, value]) => keys.includes(key) && newClassesByCondition[key] === value)
                                                )
                                                    return true
                                            }
                                            classesConditions.push(param as any)
                                        }
                                    } else {
                                        const keys = Object.keys(param)
                                        if (keys.length) {
                                            switch (typeof param[keys[0]]) {
                                                case 'object':
                                                case 'string':
                                                    if (valuesByProp) {
                                                        for (const eachProp of keys) {
                                                            const value = param[eachProp]
                                                            switch (typeof value) {
                                                                case 'object':
                                                                    if (eachProp in valuesByProp) {
                                                                        const classesByPropValue = valuesByProp[eachProp] as Record<string, string>
                                                                        for (const eachPropValue in value) {
                                                                            if (!(eachPropValue in classesByPropValue)) {
                                                                                classesByPropValue[eachPropValue] = value[eachPropValue] as string
                                                                            }
                                                                        }
                                                                    } else {
                                                                        valuesByProp[eachProp] = value
                                                                    }
                                                                    break
                                                                case 'string':
                                                                    if (!(eachProp in valuesByProp)) {
                                                                        valuesByProp[eachProp] = value
                                                                    }
                                                                    break
                                                            }
                                                        }
                                                        return true
                                                    } else {
                                                        valuesByProp = param
                                                    }
                                                    break
                                                case 'boolean':
                                                    for (const eachProp of keys) {
                                                        if (param[eachProp]) {
                                                            classNames.push(eachProp)
                                                        }
                                                    }
                                                    return true
                                            }
                                        }
                                    }
                                    break
                                case 'function':
                                    // eslint-disable-next-line no-case-declarations
                                    const transformedParam = param(mergedProps)
                                    if (typeof transformedParam === 'object' && handleParam(transformedParam))
                                        return true
                                    break
                            }
                        }

                        for (let i = newTagParams.length - 1; i >= 0; i--) {
                            const eachNewTagParam = newTagParams[i]
                            const newParams = [...eachNewTagParam[1]]
                            for (let j = 0; j < newParams.length; j++) {
                                if (handleParam(newParams[j])) {
                                    newParams[j] = ''
                                }
                            }
                            unhandledTagParams.push([eachNewTagParam[0], newParams])
                        }

                        for (let i = unhandledTagParams.length - 1; i >= 0; i--) {
                            const eachHandledTagParam = unhandledTagParams[i]
                            classNames.push(cv(eachHandledTagParam[0], ...eachHandledTagParam[1])(mergedProps as any))
                        }

                        const newAttrs: Record<string, any> = {}
                        for (const key in attrs) {
                            if (!key.startsWith('$')) {
                                newAttrs[key] = attrs[key]
                            }
                        }

                        return h(tag, { ...props, ...newAttrs, class: line(classNames, attrs.class) }, slots.default?.())
                    }
                }
            ) as any as MasterComponent<any, E>

            Component.params = newTagParams
            Component.tag = tag
            // @ts-ignore
            Component.inheritAttrs = false
            return Component
        }

        const firstParam = params[0]
        let newTagParams = tagParams || []
        if (firstParam.params) {
            newTagParams = [...newTagParams, ...firstParam.params]
        }

        if (Array.isArray(firstParam) && 'raw' in firstParam) {
            return generateComponent(firstParam as TemplateStringsArray, ...params.slice(1))
        } else if (typeof firstParam === 'object' && 'setup' in firstParam) {
            return handle(tag, newTagParams)
        } else if (typeof firstParam === 'object' && '__v_isVNode' in firstParam) {
            return handle(
                typeof tag === 'string'
                    ? firstParam
                    : extend(tag, firstParam),
                newTagParams
            )
        } else {
            const templateStringsArray: string[] = []
            const newParams: any[] = []
            for (const eachParam of params) {
                (typeof eachParam === 'string' ? templateStringsArray : newParams).push(eachParam)
            }

            return generateComponent(templateStringsArray as any, ...newParams)
        }
    }
}