'use client'

import Demo from 'shared/components/Demo'
import Code from 'shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="@fill:none">
        {(className: string) => <>
            <Basic className={className} />
        </>}
    </SyntaxTable>