'use client'

import Demo from 'websites-shared/components/Demo'
import Code from 'websites-shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="clear:both">
                    {(className: string) =>
                        <>
                            <Demo>
                                <div>
                                    <div className="box w:150 h:200 float:left">Left</div>
                                    <div className="box w:150 h:200 float:left">Left</div>
                                    <div className="box w:150 h:120 float:right">Right</div>
                                    <div className={line(className, 'box w:150 h:120')}>Clear</div>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <div>
                                    <div class="float:left">Left</div>
                                    <div class="float:left">Left</div>
                                    <div class="float:right">Right</div>
                                    <div class="**${className}**">Clear</div>
                                </div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>