'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="order:first">
                    {(className: string) =>
                        <>
                            <Demo className="py:0">
                                <div className="bg-stripe flex gap:10 p:10 w:full">
                                    <div className="box o:-3">1</div>
                                    <div className="box o:-1">2</div>
                                    <div className={line(className, 'flex:1 box bg:blue-58! fg:white')}>{className}</div>
                                    <div className="box o:1">4</div>
                                    <div className="box o:3">5</div>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <div class="flex">
                                    <div class="o:-3">…</div>
                                    <div class="o:-1">…</div>
                                    <div class="**${className}**">…</div>
                                    <div class="o:1">…</div>
                                    <div class="o:3">…</div>
                                </div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>