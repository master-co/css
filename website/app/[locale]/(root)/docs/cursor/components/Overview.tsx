'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="cursor:pointer">
                    {(className: string) =>
                        <>
                            <Code lang="html">{`
                                <div class="**${className}**">submit</div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>