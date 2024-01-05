'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="fg:blue" previewClass={(className: string) => {
        return (
            <span className={clsx('font:16 font:medium mr:3x v:top', className, {
                'bg:tiny': className === 'fg:transparent'
            })}>Aa</span>
        )
    }}>
        {(className: string) => <Basic className={className} />}
    </SyntaxTable>