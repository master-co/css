'use client'

import Demo from 'shared/components/Demo'
import Code from 'shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes}></SyntaxTable>