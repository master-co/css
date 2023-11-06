'use client'

import Basic from './Basic'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'

export default () =>
    <SyntaxTable value={syntaxes} default="float:left">
        {(className: string) => <>
            <Basic className={className} />
        </>}
    </SyntaxTable>
