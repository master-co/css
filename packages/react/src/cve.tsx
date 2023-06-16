import React, { forwardRef } from 'react'
import cv from 'class-variant'
import line from '@techor/one-liner'

type baseType<E> = string 
    | string[]
    | Record<string, boolean>
    | [string, { [key in keyof E]?: E[key] }]
    | { [key in keyof E]?: Record<string, E[key]> }
type baseLoopType<E> = baseType<E> | Array<baseType<E>>;
type extraType<E> = { className?: baseLoopType<E> | undefined, [key: string]: any };
type TagParams = Array<[TemplateStringsArray, any[]]>;

type IntrinsicElementsKeys = keyof JSX.IntrinsicElements;
type MasterComponentProps<K extends IntrinsicElementsKeys | React.ComponentType<any>, E extends object = object> = Omit<K extends IntrinsicElementsKeys
    ? JSX.IntrinsicElements[K] extends React.DetailedHTMLProps<infer Attributes, infer Element>
        ? Attributes & Partial<E>
        : never
    : K extends React.ComponentType<infer U>
        ? U & Partial<E>
        : never, 'className' | 'ref'> & extraType<E>;
type MasterExoticComponent<K extends IntrinsicElementsKeys | React.ComponentType<any>, E extends object = object> = React.ForwardRefExoticComponent<MasterComponentProps<K, E> & React.RefAttributes<K>> & { tag: K, params: TagParam };

type ParamsType<K extends IntrinsicElementsKeys | React.ComponentType<any>, E extends object = object> = Array<((props: MasterComponentProps<K, E>) => baseLoopType<MasterComponentProps<K, E>> | undefined) | baseLoopType<MasterComponentProps<K, E>>>;

type ReturnType<K extends IntrinsicElementsKeys | React.ComponentType<any>, E extends object = object> = <F extends TemplateStringsArray | MasterExoticComponent<any> | baseType<E>>(
    firstParam: F,
    ...params: F extends MasterExoticComponent<any, any>
        ? never
        : ParamsType<K, E>
) => (F extends MasterExoticComponent<any, any>
    ? ReturnType<K, E>
    : MasterExoticComponent<K, E>)

const cve: {
    [key in IntrinsicElementsKeys]: (<F extends MasterExoticComponent<any, any>, E extends object = object>(firstParam: F) => F extends MasterExoticComponent<any, infer ME> ? ReturnType<key, ME & E> : never)
        & (<E extends object = object>(firstParam: TemplateStringsArray | baseType<E>, ...params: ParamsType<key, E>) => MasterExoticComponent<key, E>)
} & {
    <F extends MasterExoticComponent<any>, E extends object = object>(firstParam: F): F extends MasterExoticComponent<infer K, infer ME> ? ReturnType<K, ME & E> : never
} & {
    <E extends object = object>(firstParam: TemplateStringsArray | baseType<MasterComponentProps<'div', E>>, ...params: ParamsType<'div', E>): MasterExoticComponent<'div', E>
} & {
    //@ts-ignore
    <F extends React.ComponentType<any>, E extends object = object>(firstParam: F, ...params: F extends React.ComponentType<infer RE> ? ParamsType<'div', RE & E> : never): F extends React.ComponentType<infer RE> ? ReturnType<React.ComponentType<RE & E>> :never
} = new Proxy(
    ((firstParam, ...params) => {
        return (Array.isArray(firstParam) && 'raw' in firstParam || typeof firstParam !== 'object' || !('render' in firstParam))
            ? cve.div(firstParam as any, ...params)
            : handle(firstParam.tag ?? firstParam, firstParam.params, firstParam.displayName)
    }) as any,
    {
        get: function (target, Tag: IntrinsicElementsKeys) {
            if (!(Tag in target)) {
                target[Tag] = handle(Tag, undefined, 'master.' + Tag)
            }
            return target[Tag]
        }
    }
)

function handle<K extends IntrinsicElementsKeys | React.ComponentType<any>, E extends object = object>(Tag: K, tagParams: TagParams, displayName: string, defaultProps?: Partial<E>) {
    return (...params: any[]) => {
        const generateFunctionComponent = (defaultClassNames: TemplateStringsArray, ...params: any[]) => {
            const newTagParams: TagParams = [...(tagParams || []), [defaultClassNames, params]]
            const component = forwardRef<K, MasterComponentProps<K, E>>((props, ref) => {
                const classesConditions: [string, Record<string, string | number | boolean>][] = []
                let valuesByProp: Record<string, Record<string, string>>
                const unhandledTagParams: TagParams = []
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
                                            if (valuesByProp) {
                                                for (const eachProp of keys) {
                                                    const newClassesByPropValue = param[eachProp] as Record<string, string>
                                                    if (eachProp in valuesByProp) {
                                                        const classesByPropValue = valuesByProp[eachProp]
                                                        for (const eachNewPropValue in newClassesByPropValue) {
                                                            if (!(eachNewPropValue in classesByPropValue)) {
                                                                classesByPropValue[eachNewPropValue] = newClassesByPropValue[eachNewPropValue]
                                                            }
                                                        }
                                                    } else {
                                                        valuesByProp[eachProp] = newClassesByPropValue
                                                    }
                                                }
                                                return true
                                            } else {
                                                valuesByProp = param
                                            }
                                            break
                                    } 
                                }
                            }
                            break
                        case 'function':
                            // eslint-disable-next-line no-case-declarations
                            const transformedParam = param(props)
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

                const classNames: string[] = []
                for (let i = unhandledTagParams.length - 1; i >= 0; i--) {
                    const eachHandledTagParam = unhandledTagParams[i]
                    classNames.push(cv(eachHandledTagParam[0], ...eachHandledTagParam[1])(props))
                }
    
                const newProps: Record<string, any> = {}
                for (const key in props) {
                    if (!key.startsWith('$')) {
                        newProps[key] = props[key]
                    }
                }

                console.dir(unhandledTagParams, { depth: null })
                console.log(props)

                // @ts-ignore
                return <Tag ref={ref} {...newProps} className={line(classNames, props.className)} />
            }) as any as MasterExoticComponent<K, E>
    
            component.displayName = displayName
            component.tag = Tag
            component.params = newTagParams
            component.defaultProps = defaultProps as any
            return component
        }

        const firstParam = params[0]
        let newTagParams = tagParams || []
        if (firstParam.params) {
            newTagParams = [...newTagParams, ...firstParam.params]
        }

        if (Array.isArray(firstParam) && 'raw' in firstParam) {
            return generateFunctionComponent(firstParam as TemplateStringsArray, ...params.slice(1))
        } else if (typeof firstParam === 'object' && 'render' in firstParam) {
            return handle(Tag, newTagParams, firstParam.displayName, firstParam.defaultProps)
        } else {
            const templateStringsArray = []
            const newParams = []
            for (const eachParam of params) {
                (typeof eachParam === 'string' ? templateStringsArray : newParams).push(eachParam)
            }

            return generateFunctionComponent(templateStringsArray as any, ...newParams)
        }
    }
}

export { cve }