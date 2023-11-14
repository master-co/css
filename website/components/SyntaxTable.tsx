'use client'

import DocTable from 'websites/components/DocTable'
import { Fragment, useMemo, useState } from 'react'
import { beautifyCSS } from 'websites/utils/beautifyCSS'
import line from 'to-line'
import { snackbar } from 'websites/utils/snackbar'
import InlineCode from 'websites/components/InlineCode'
import dedent from 'ts-dedent'
import MasterCSS from '@master/css'

export default function SyntaxTable({ title, value, children, previewClass, ...props }: any) {
    const [selectedClassName, setSelectedClassName] = useState(props.default)
    const content = useMemo(() => children?.(selectedClassName), [children, selectedClassName])
    return (
        <>
            <DocTable {...props} className={children ? 'mb:30' : 'mb:50'}>
                <thead>
                    <tr>
                        <th className="sticky bg:base top:0 z:1">{title || 'Class'}</th>
                        <th className="sticky bg:base top:0 z:2">Declarations</th>
                    </tr>
                </thead>
                <tbody>
                    {value.map((eachName: string, index: number) => {
                        const isArrayClassNames = Array.isArray(eachName)
                        const isClickableItem = isArrayClassNames
                            ? !eachName.find((eachInnerName) => eachInnerName.includes('`'))
                            : !eachName.includes('`')
                        const targetClassName = isArrayClassNames ? eachName[0] : eachName
                        const cssText = processCssText(eachName)
                        return (
                            <tr key={eachName} onClick={
                                isClickableItem ? () => {
                                    if (isClickableItem) {
                                        snackbar('Class copied <code class="font:90% font:semibold ls:-.5">' + targetClassName + '</code>')
                                        navigator.clipboard.writeText(targetClassName)
                                        setSelectedClassName(targetClassName)
                                    }
                                } : undefined
                            } className={line({ 'cursor:pointer': isClickableItem && !targetClassName.includes('cursor') }, targetClassName.includes('cursor') ? targetClassName : '')}>
                                <td>
                                    {previewClass && !isArrayClassNames && previewClass(targetClassName)}
                                    {(isArrayClassNames ? eachName : [eachName]).map((eachInnerName: string, i, array) => (
                                        <Fragment key={eachInnerName}>
                                            <InlineCode lang="mcss">{eachInnerName}</InlineCode>
                                            {(i !== array.length - 1) && <code className="fg:slate-90! fg:gray!@dark"> / </code>}
                                        </Fragment>
                                    ))}
                                </td>
                                <td>
                                    {eachName && cssText &&
                                        <InlineCode lang="css" className="fg:neutral white-space:pre">{cssText}</InlineCode>
                                    }
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </DocTable>
            {content}
        </>
    )
}

const processCssText = (name: string | Record<string, any>) => {
    let target = (Array.isArray(name)
        ? name[0]
        : name)
    // `size` -> 9999999999
    target = target.replace(/`size`/g, '1600')
    const classes = target.split(' ')
    const css = new MasterCSS()
    classes.forEach((eachClass: string) => css.add(eachClass))
    let text = css.text
    if (!text) return
    text = beautifyCSS(text)
    return text?.replace(/\..*(?:\\}|\\}\\\))(?={.*:[^}]*})/, '')
        .replace(/@keyframes\s+[\w-]+\s*{\s*([\s\S]*{[\s\S]*?})*\s*}/g, '')
        .replace(/.*{([\s\S]*?)}.*/g, '$1')
        .replace(/`(.*?)`/g, `_PLACEHOLDER_$1_PLACEHOLDER_`)
        .replace(/(1600|100)/g, '`size`')
}