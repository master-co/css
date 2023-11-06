'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="@direction:normal">
        {(className: string) => <>
            <Basic className={className} />
        </>}
    </SyntaxTable>