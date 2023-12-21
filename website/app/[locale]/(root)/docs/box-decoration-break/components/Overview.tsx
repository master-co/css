'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'
import BoxDecorationSpan from './BoxDecorationSpan'
import Basic from './Basic'

export default () =>
    <SyntaxTable value={syntaxes} default="box-decoration:slice">
        {(className: string) => <Basic className={className} />}
    </SyntaxTable>