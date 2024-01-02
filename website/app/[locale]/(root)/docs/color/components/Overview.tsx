'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'

export default () =>
    <SyntaxTable value={syntaxes} default="fg:blue" previewClass={(className: string) => {
        return (
            <span className={clsx('font:16 font:bold mr:3x', className)}>Aa</span>
        )
    }}>
        {(className: string) => (
            <>
                <Demo>
                    <div className={clsx(className, 'font:56 font:heavy')}>Aa</div>
                </Demo>
                <Code lang="html">{`<div class="**${className}**">Aa</div>`}</Code>
            </>
        )}
    </SyntaxTable>