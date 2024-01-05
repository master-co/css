'use client'

import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'

export default () =>
    <SyntaxTable value={syntaxes} previewClass={(className: string) => {
        return (
            <span className={clsx('font:16 font:medium mr:3x v:top', className)}>Aa</span>
        )
    }}></SyntaxTable>