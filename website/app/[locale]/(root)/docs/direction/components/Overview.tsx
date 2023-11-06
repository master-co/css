'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="direction:ltr">
                    {(className: string) =>
                        <>
                            <Demo className="py:0!">
                                <div className={line(className, 'w:full bg:white@light bg:gray-20@dark p:30')}>
                                    <div className="f:28 f:bold">Animals</div>
                                    <p>There are a wide variety of animals in the world, and each one has its own unique set of characteristics and habits.</p>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <div class="**${className}**">
                                    <h3>Animals</h3>
                                    <p>There are a wide variety of animals in the world …</p>
                                </div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>