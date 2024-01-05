'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="align-items:center">
                    {(className: string) =>
                        <>
                            <Demo className="py:0">
                                <div className={line(className, 'w:full bg-stripe p:10 flex gap:10')}>
                                    <div className="box flex:1 py:30">One</div>
                                    <div className="box flex:1 py:12x">Two</div>
                                    <div className="box flex:1 py:20">Three</div>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <div class="flex **${className}**">
                                    <div class="py:30 flex:1">One</div>
                                    <div class="py:12x flex:1">Two</div>
                                    <div class="py:20 flex:1">Three</div>
                                </div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>