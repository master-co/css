'use client'

import DocTable from 'websites/components/DocTable'
import { Fragment, useMemo, useState } from 'react'
import line from 'to-line'
import { snackbar } from 'websites/utils/snackbar'
import InlineCode from 'websites/components/InlineCode'
import MasterCSS from '@master/css'

export default function SyntaxTable({ title, value, children, previewClass, scrollY, ...props }: any) {
    const [selectedClassName, setSelectedClassName] = useState(props.default)
    const content = useMemo(() => children?.(selectedClassName), [children, selectedClassName])
    const rows = useMemo(() =>
        value.map((eachName: string, index: number) => {
            const isArrayClassNames = Array.isArray(eachName)
            const isClickableItem = isArrayClassNames
                ? !eachName.find((eachInnerName) => eachInnerName.includes('`'))
                : !eachName.includes('`')
            const targetClassName = isArrayClassNames ? eachName[0] : eachName
            const { text } = generateCSS(eachName)
            return (
                <tr key={eachName} onClick={
                    isClickableItem ? () => {
                        if (isClickableItem) {
                            snackbar('<code class="font:90% font:semibold ls:-.5">' + targetClassName + '</code> copied')
                            navigator.clipboard.writeText(targetClassName)
                            // improve perf
                            setTimeout(() => {
                                setSelectedClassName(targetClassName)
                            })
                        }
                    } : undefined
                } className={line({ 'cursor:pointer': isClickableItem && !targetClassName.includes('cursor') }, targetClassName.includes('cursor') ? targetClassName : '')}>
                    <td>
                        {previewClass && !isArrayClassNames && previewClass(targetClassName)}
                        {(isArrayClassNames ? eachName : [eachName]).map((eachInnerName: string, i, array) => (
                            <Fragment key={eachInnerName}>
                                <InlineCode lang="mcss">{eachInnerName}</InlineCode>
                                {(i !== array.length - 1) && <code className="fg:lightest"> / </code>}
                            </Fragment>
                        ))}
                    </td>
                    <td>
                        {eachName && text &&
                            <InlineCode lang="css" className="fg:neutral white-space:pre">{text}</InlineCode>
                        }
                    </td>
                </tr>
            )
        }), [value, previewClass])
    return (
        <>
            <DocTable {...props} className={children ? 'mb:30' : 'mb:12x'} scrollY={scrollY !== undefined ? scrollY : 424}>
                <thead>
                    <tr>
                        <th className="sticky bg:base top:0 z:1">{title || 'Class'}</th>
                        <th className="sticky bg:base top:0 z:2">Declarations</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </DocTable>
            {content}
        </>
    )
}

const generateCSS = (name: string | Record<string, any>) => {
    let target = (Array.isArray(name)
        ? name[0]
        : name)
    // `size` -> 9999999999
    target = target
        .replace(/`size`/g, '160000000')
        .replace(/`value`/g, 'var(--value)')
    const classes = target.split(' ')
    const css = new MasterCSS()
    classes.forEach((eachClass: string) => css.add(eachClass))
    if (!css.rules.length) {
        throw new Error(`Class "${name}" not found`)
    }
    const declarations = css.rules[css.rules.length - 1].declarations as any
    for (const declarationName in declarations) {
        if (typeof declarations[declarationName] === 'string')
            declarations[declarationName] = declarations[declarationName]
                .replace(/var\(--value\)/g, '`value`')
    }
    return {
        text: convertDeclarationsToCSS(declarations),
        declarations
    }
}

function convertDeclarationsToCSS(obj: any) {
    let cssText = ''

    for (const property in obj) {
        if (Object.hasOwn(obj, property)) {
            cssText += `${property}: ${obj[property]};\n`
        }
    }

    return cssText
}