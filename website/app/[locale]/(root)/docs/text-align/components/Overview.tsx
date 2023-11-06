'use client'

import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="text:left">
        {(className: any) => <>
            <Basic className={className} />
            <Code lang="html">{`
                <p class="**${className}**">Lorem ipsum dolor sit amet …</p>
            `}</Code>
        </>}
    </SyntaxTable>