'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'
import clsx from 'clsx'

export default () =>
    <SyntaxTable value={syntaxes} previewClass={(className: string) => {
        return (
            <span className={clsx('font:16 font:bold mr:3x', className)}>Aa</span>
        )
    }}></SyntaxTable>