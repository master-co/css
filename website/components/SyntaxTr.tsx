import { Fragment } from 'react'
import InlineCode from '../../../../components/InlineCode'
import clsx from 'clsx'
import { MasterCSS } from '@master/css'

export default function SyntaxTr({ value, children, previewSyntax }: any) {
    const { text } = generateCSS(value)
    return (
        <tr key={value}>
            <td className='white-space:nowrap'>
                {children}
                {(Array.isArray(value) ? value : [value]).map((eachInnerName: string, i, array) => (
                    <Fragment key={eachInnerName}>
                        <InlineCode lang="mcss" className={clsx({
                            invalid: Array.isArray(value),
                            'text:underline': previewSyntax === eachInnerName
                        })}>{eachInnerName}</InlineCode>
                        {(i !== array.length - 1) && <code className="fg:lightest"> / </code>}
                    </Fragment>
                ))}
            </td>
            <td>
                {value && text &&
                    <InlineCode lang="css" className="fg:neutral white-space:pre">{text}</InlineCode>
                }
            </td>
        </tr>
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
        .replace(/`n\/d`/g, '100000000%')
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
                .replace(/10000000rem/g, '`size`rem')
                .replace(/100000000%/g, '`r`%')
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