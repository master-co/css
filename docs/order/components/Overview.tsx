'use client'

import Demo from 'shared/components/Demo'
import Code from 'shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="order:first">
                    {(className: string) =>
                        <>
                            <Demo className="py:0">
                                <div className="w:full bg-stripe p:10 flex gap:10">
                                    <div className="o:-3 box">1</div>
                                    <div className="o:-1 box">2</div>
                                    <div className={line(className, 'flex:1 box bg:blue-58! fg:white')}>{className}</div>
                                    <div className="o:1 box">4</div>
                                    <div className="o:3 box">5</div>
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