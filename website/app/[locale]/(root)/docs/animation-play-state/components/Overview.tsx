'use client'

import Demo from 'websites-shared/components/Demo'
import Code from 'websites-shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="@play:running">
        {(className: string) => <>
            <Basic className={className} />
        </>}
    </SyntaxTable>